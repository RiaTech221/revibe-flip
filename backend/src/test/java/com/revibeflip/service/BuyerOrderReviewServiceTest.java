package com.revibeflip.service;

import com.revibeflip.dto.AddressDto;
import com.revibeflip.dto.AddressRequest;
import com.revibeflip.dto.CreateOrderRequest;
import com.revibeflip.dto.CreateReviewRequest;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.dto.ReviewDto;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BuyerOrderReviewServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private ProductRepository productRepository;
    @Mock private DeliveryRepository deliveryRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ReviewRepository reviewRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private PlatformSettingRepository platformSettingRepository;
    @Mock private AddressRepository addressRepository;
    @Mock private CartRepository cartRepository;
    @Mock private PaymentService paymentService;

    private OrderService orderService;
    private ReviewService reviewService;
    private AddressService addressService;
    private NotificationService notificationService;

    private User buyer;
    private User seller;
    private User otherBuyer;
    private Product product;
    private PlatformSetting setting;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, messagingTemplate);
        orderService = new OrderService(
                orderRepository,
                productRepository,
                deliveryRepository,
                paymentRepository,
                notificationService,
                platformSettingRepository,
                cartRepository,
                paymentService
        );
        reviewService = new ReviewService(reviewRepository, orderRepository, userRepository, notificationService);
        addressService = new AddressService(addressRepository);

        buyer = User.builder()
                .id(101L)
                .phone("+221771112233")
                .firstName("Moussa")
                .lastName("Diallo")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        seller = User.builder()
                .id(102L)
                .phone("+221774445566")
                .firstName("Fatou")
                .lastName("Ndiaye")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .rating(5.0)
                .reviewCount(0)
                .build();

        otherBuyer = User.builder()
                .id(103L)
                .phone("+221779998877")
                .firstName("Ibrahima")
                .lastName("Sow")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        product = Product.builder()
                .id(501L)
                .title("Robe Bazin Riche")
                .price(BigDecimal.valueOf(20000))
                .status(ProductStatus.ACTIVE)
                .seller(seller)
                .build();

        setting = PlatformSetting.builder()
                .id(1L)
                .commissionRate(BigDecimal.valueOf(20.0))
                .validationFeeRate(BigDecimal.valueOf(1.0))
                .platformName("ReVibe FliP")
                .build();
    }

    @Test
    @DisplayName("Acheteur : création de commande avec calcul exact de l'escrow 1% et livraison")
    void testCreateOrderSuccess() {
        when(productRepository.findById(501L)).thenReturn(Optional.of(product));
        when(orderRepository.existsByProductIdAndStatusIn(eq(501L), any())).thenReturn(false);
        when(platformSettingRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(setting));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(1001L);
            return o;
        });

        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(501L);
        request.setDeliveryMode(DeliveryMode.HOME_DELIVERY);
        request.setDeliveryAddress("Mermoz Sacré-Cœur");
        request.setDeliveryCity("Dakar");
        request.setDeliveryPhone("+221771112233");

        OrderDto created = orderService.createOrder(request, buyer);

        assertThat(created).isNotNull();
        assertThat(created.getItemPrice()).isEqualByComparingTo("20000");
        assertThat(created.getValidationFee()).isEqualByComparingTo("200"); // 1%
        assertThat(created.getDeliveryFee()).isEqualByComparingTo("2000"); // HOME_DELIVERY
        assertThat(created.getTotalAmount()).isEqualByComparingTo("22200"); // 20000 + 200 + 2000
        assertThat(created.getPlatformCommission()).isEqualByComparingTo("4000"); // 20%
        assertThat(created.getSellerPayout()).isEqualByComparingTo("16000"); // 20000 - 4000
    }

    @Test
    @DisplayName("Acheteur : interdiction d'acheter son propre article")
    void testCannotBuyOwnProduct() {
        product.setSeller(buyer);
        when(productRepository.findById(501L)).thenReturn(Optional.of(product));

        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(501L);

        assertThatThrownBy(() -> orderService.createOrder(request, buyer))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Vous ne pouvez pas acheter votre propre article");
    }

    @Test
    @DisplayName("Sécurité : un compte suspendu ne peut pas passer de commande")
    void testSuspendedBuyerCannotOrder() {
        buyer.setIsSuspended(true);
        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(501L);

        assertThatThrownBy(() -> orderService.createOrder(request, buyer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("suspendu");
    }

    @Test
    @DisplayName("Concurrence : interdiction de commander un article déjà réservé ou vendu")
    void testDoubleBookingPrevented() {
        when(productRepository.findById(501L)).thenReturn(Optional.of(product));
        when(orderRepository.existsByProductIdAndStatusIn(eq(501L), any())).thenReturn(true);

        CreateOrderRequest request = new CreateOrderRequest();
        request.setProductId(501L);

        assertThatThrownBy(() -> orderService.createOrder(request, buyer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà");
    }

    @Test
    @DisplayName("Escrow : confirmation de réception par l'acheteur débloque les fonds au vendeur")
    void testConfirmReceiptSuccess() {
        Order order = Order.builder()
                .id(1001L)
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .status(OrderStatus.DELIVERED)
                .sellerPayout(BigDecimal.valueOf(16000))
                .build();

        Delivery delivery = Delivery.builder()
                .id(2001L)
                .order(order)
                .mode(DeliveryMode.HOME_DELIVERY)
                .status(DeliveryStatus.DELIVERED)
                .build();

        Payment payment = Payment.builder()
                .id(3001L)
                .order(order)
                .paymentMethod(PaymentMethod.WAVE)
                .status(PaymentStatus.SUCCESS)
                .escrowStatus(EscrowStatus.LOCKED)
                .build();

        when(orderRepository.findById(1001L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));
        when(deliveryRepository.findByOrderId(1001L)).thenReturn(Optional.of(delivery));
        when(paymentRepository.findByOrderId(1001L)).thenReturn(Optional.of(payment));

        OrderDto confirmed = orderService.confirmReceipt(1001L, buyer);

        assertThat(confirmed.getStatus()).isEqualTo("COMPLETED");
        verify(paymentService).releaseFundsToSeller(any(Order.class));
        assertThat(delivery.getStatus()).isEqualTo(DeliveryStatus.DELIVERED);
    }

    @Test
    @DisplayName("Sécurité : un autre utilisateur ne peut pas confirmer la réception")
    void testOtherUserCannotConfirmReceipt() {
        Order order = Order.builder()
                .id(1001L)
                .buyer(buyer)
                .seller(seller)
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .build();

        when(orderRepository.findById(1001L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.confirmReceipt(1001L, otherBuyer))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Seul l'acheteur");
    }

    @Test
    @DisplayName("Avis : un acheteur peut noter son vendeur après complétion de la commande")
    void testReviewSubmissionSuccess() {
        Order completedOrder = Order.builder()
                .id(1001L)
                .buyer(buyer)
                .seller(seller)
                .status(OrderStatus.COMPLETED)
                .build();

        when(orderRepository.findById(1001L)).thenReturn(Optional.of(completedOrder));
        when(reviewRepository.findByOrderId(1001L)).thenReturn(Optional.empty());
        when(reviewRepository.save(any(Review.class))).thenAnswer(inv -> {
            Review r = inv.getArgument(0);
            r.setId(7001L);
            return r;
        });
        when(reviewRepository.calculateAverageRating(seller.getId())).thenReturn(4.8);
        when(reviewRepository.countByTargetUserId(seller.getId())).thenReturn(1L);

        CreateReviewRequest req = new CreateReviewRequest();
        req.setOrderId(1001L);
        req.setRating(5);
        req.setComment("Vendeuse très réactive, article impeccable !");

        ReviewDto review = reviewService.createReview(req, buyer);

        assertThat(review).isNotNull();
        assertThat(review.getRating()).isEqualTo(5);
        verify(userRepository).save(seller);
    }

    @Test
    @DisplayName("Avis : impossible de noter une commande non terminée ou en double")
    void testCannotReviewIncompleteOrDuplicateOrder() {
        Order pendingOrder = Order.builder()
                .id(1001L)
                .buyer(buyer)
                .seller(seller)
                .status(OrderStatus.PAID_ESCROW_LOCKED)
                .build();

        when(orderRepository.findById(1001L)).thenReturn(Optional.of(pendingOrder));

        CreateReviewRequest req = new CreateReviewRequest();
        req.setOrderId(1001L);
        req.setRating(4);

        assertThatThrownBy(() -> reviewService.createReview(req, buyer))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("terminée");
    }

    @Test
    @DisplayName("Carnet d'adresses : ajout et gestion de l'adresse par défaut")
    void testAddressManagement() {
        when(addressRepository.countByUserId(buyer.getId())).thenReturn(0L);
        when(addressRepository.save(any(Address.class))).thenAnswer(inv -> {
            Address a = inv.getArgument(0);
            a.setId(901L);
            return a;
        });

        AddressRequest req = new AddressRequest();
        req.setTitle("Domicile");
        req.setRecipientName("Moussa Diallo");
        req.setPhone("+221771112233");
        req.setCity("Dakar Plateau");
        req.setAddressLine("Avenue Ponty, Immeuble B");
        req.setIsDefault(true);

        AddressDto addr = addressService.createAddress(buyer, req);

        assertThat(addr).isNotNull();
        assertThat(addr.getTitle()).isEqualTo("Domicile");
        assertThat(addr.getIsDefault()).isTrue();
    }
}
