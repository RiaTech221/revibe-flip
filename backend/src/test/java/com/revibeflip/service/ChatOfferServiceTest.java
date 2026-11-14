package com.revibeflip.service;

import com.revibeflip.dto.ChatOfferDto;
import com.revibeflip.dto.CreateOfferRequest;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatOfferServiceTest {

    @Mock private ChatOfferRepository chatOfferRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private DeliveryRepository deliveryRepository;
    @Mock private PlatformSettingRepository platformSettingRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    private NotificationService notificationService;
    private ChatOfferService chatOfferService;

    private User buyer;
    private User seller;
    private User thirdParty;
    private Product product;
    private Conversation conversation;
    private PlatformSetting platformSetting;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, messagingTemplate);
        chatOfferService = new ChatOfferService(
                chatOfferRepository,
                conversationRepository,
                messageRepository,
                productRepository,
                orderRepository,
                orderItemRepository,
                deliveryRepository,
                platformSettingRepository,
                notificationService,
                messagingTemplate
        );

        buyer = User.builder()
                .id(1L)
                .firstName("Awa")
                .lastName("Ndiaye")
                .phone("+221771111111")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        seller = User.builder()
                .id(2L)
                .firstName("Aminata")
                .lastName("Diallo")
                .phone("+221772222222")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        thirdParty = User.builder()
                .id(99L)
                .firstName("Intrus")
                .lastName("Inconnu")
                .phone("+221779999999")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        product = Product.builder()
                .id(100L)
                .title("Grand Boubou Brodé")
                .price(BigDecimal.valueOf(35000))
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .build();

        conversation = Conversation.builder()
                .id(10L)
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .referencedProducts(new ArrayList<>(List.of(product)))
                .build();

        platformSetting = PlatformSetting.builder()
                .commissionRate(BigDecimal.valueOf(20.0))
                .validationFeeRate(BigDecimal.valueOf(1.0))
                .offerValidityHours(24)
                .reservationDurationHours(24)
                .build();

        lenient().when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(platformSetting));
    }

    @Test
    @DisplayName("Création d'offre réussie avec prix convenu <= prix affiché")
    void createOffer_success() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));
        when(chatOfferRepository.findFirstByConversationIdAndStatusOrderByCreatedAtDesc(10L, OfferStatus.OFFER_SENT))
                .thenReturn(Optional.empty());
        when(chatOfferRepository.save(any(ChatOffer.class))).thenAnswer(i -> {
            ChatOffer o = i.getArgument(0);
            o.setId(500L);
            return o;
        });

        CreateOfferRequest req = CreateOfferRequest.builder()
                .conversationId(10L)
                .productId(100L)
                .agreedPrice(BigDecimal.valueOf(30000)) // 30 000 <= 35 000
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryFee(BigDecimal.valueOf(2000))
                .validityHours(24)
                .build();

        ChatOfferDto dto = chatOfferService.createOffer(seller, req);

        assertThat(dto.getAgreedPrice()).isEqualByComparingTo("30000");
        assertThat(dto.getInitialPrice()).isEqualByComparingTo("35000");
        // Frais validation 1% sur 30 000 = 300 FCFA
        assertThat(dto.getValidationFee()).isEqualByComparingTo("300");
        assertThat(dto.getDeliveryFee()).isEqualByComparingTo("2000");
        // Total = 30 000 + 300 + 2000 = 32 300 FCFA
        assertThat(dto.getTotalAmount()).isEqualByComparingTo("32300");
        assertThat(dto.getStatus()).isEqualTo(OfferStatus.OFFER_SENT);
    }

    @Test
    @DisplayName("Rejet : prix convenu supérieur au prix affiché interdit")
    void createOffer_higherPrice_throwsIllegalArgumentException() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));
        when(productRepository.findById(100L)).thenReturn(Optional.of(product));

        CreateOfferRequest req = CreateOfferRequest.builder()
                .conversationId(10L)
                .productId(100L)
                .agreedPrice(BigDecimal.valueOf(40000)) // 40 000 > 35 000 interdit !
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .build();

        assertThatThrownBy(() -> chatOfferService.createOffer(seller, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ne peut pas être supérieur au prix affiché");
    }

    @Test
    @DisplayName("Rejet : offre émise par un utilisateur qui n'est pas le propriétaire de l'article")
    void createOffer_nonOwnerSeller_throwsAccessDeniedException() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(conversation));

        CreateOfferRequest req = CreateOfferRequest.builder()
                .conversationId(10L)
                .productId(100L)
                .agreedPrice(BigDecimal.valueOf(30000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .build();

        // Intrus tente d'émettre une offre
        assertThatThrownBy(() -> chatOfferService.createOffer(thirdParty, req))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Seul le vendeur propriétaire");
    }

    @Test
    @DisplayName("Acceptation de l'offre par l'acheteur : réservation de l'article et commande AWAITING_PAYMENT au prix convenu")
    void acceptOffer_success() {
        ChatOffer offer = ChatOffer.builder()
                .id(501L)
                .conversation(conversation)
                .seller(seller)
                .buyer(buyer)
                .product(product)
                .initialPrice(BigDecimal.valueOf(35000))
                .agreedPrice(BigDecimal.valueOf(30000))
                .deliveryMode(DeliveryMode.HOME_DELIVERY)
                .deliveryFee(BigDecimal.valueOf(2000))
                .validationFee(BigDecimal.valueOf(300))
                .totalAmount(BigDecimal.valueOf(32300))
                .validityHours(24)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .status(OfferStatus.OFFER_SENT)
                .build();

        when(chatOfferRepository.findById(501L)).thenReturn(Optional.of(offer));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> {
            Order o = i.getArgument(0);
            o.setId(777L);
            return o;
        });
        when(chatOfferRepository.save(any(ChatOffer.class))).thenAnswer(i -> i.getArgument(0));

        ChatOfferDto result = chatOfferService.acceptOffer(buyer, 501L);

        assertThat(result.getStatus()).isEqualTo(OfferStatus.OFFER_ACCEPTED);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.RESERVED);
        verify(productRepository).save(product);
        verify(orderRepository).save(argThat(o -> 
            o.getItemPrice().compareTo(BigDecimal.valueOf(30000)) == 0 &&
            o.getAgreedPrice().compareTo(BigDecimal.valueOf(30000)) == 0 &&
            o.getStatus() == OrderStatus.AWAITING_PAYMENT
        ));
    }

    @Test
    @DisplayName("Rejet de double acceptation d'une offre déjà acceptée")
    void acceptOffer_alreadyAccepted_throwsIllegalStateException() {
        ChatOffer offer = ChatOffer.builder()
                .id(502L)
                .conversation(conversation)
                .seller(seller)
                .buyer(buyer)
                .product(product)
                .status(OfferStatus.OFFER_ACCEPTED)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        when(chatOfferRepository.findById(502L)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> chatOfferService.acceptOffer(buyer, 502L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà été acceptée");
    }

    @Test
    @DisplayName("Rejet : tentative d'acceptation d'une offre expirée")
    void acceptOffer_expiredOffer_throwsIllegalStateException() {
        ChatOffer offer = ChatOffer.builder()
                .id(503L)
                .conversation(conversation)
                .seller(seller)
                .buyer(buyer)
                .product(product)
                .initialPrice(BigDecimal.valueOf(35000))
                .agreedPrice(BigDecimal.valueOf(30000))
                .status(OfferStatus.OFFER_SENT)
                .expiresAt(LocalDateTime.now().minusHours(1)) // Déjà expirée !
                .build();

        when(chatOfferRepository.findById(503L)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> chatOfferService.acceptOffer(buyer, 503L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("a expiré");

        assertThat(offer.getStatus()).isEqualTo(OfferStatus.OFFER_EXPIRED);
    }

    @Test
    @DisplayName("Expiration de réservation : l'article réservé est libéré et remis en vente ACTIVE")
    void processExpirations_releasesReservedProduct() {
        product.setStatus(ProductStatus.RESERVED);
        Order expiredOrder = Order.builder()
                .id(888L)
                .orderNumber("RF-2026-88888")
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .status(OrderStatus.AWAITING_PAYMENT)
                .reservationExpiresAt(LocalDateTime.now().minusMinutes(5)) // délai dépassé
                .build();

        when(chatOfferRepository.findByStatusAndExpiresAtBefore(eq(OfferStatus.OFFER_SENT), any()))
                .thenReturn(List.of());
        when(chatOfferRepository.findOffersExpiringSoon(any(), any()))
                .thenReturn(List.of());
        when(orderRepository.findByStatusAndReservationExpiresAtBefore(eq(OrderStatus.AWAITING_PAYMENT), any()))
                .thenReturn(List.of(expiredOrder));

        chatOfferService.processExpirations();

        assertThat(expiredOrder.getStatus()).isEqualTo(OrderStatus.EXPIRED);
        assertThat(product.getStatus()).isEqualTo(ProductStatus.ACTIVE);
        verify(productRepository).save(product);
        verify(orderRepository).save(expiredOrder);
    }
}
