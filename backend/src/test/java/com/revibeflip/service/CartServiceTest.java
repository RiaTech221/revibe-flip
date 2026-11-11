package com.revibeflip.service;

import com.revibeflip.dto.AddToCartRequest;
import com.revibeflip.dto.CartDto;
import com.revibeflip.dto.CreateOrderFromCartRequest;
import com.revibeflip.dto.OrderDto;
import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
import com.revibeflip.exception.SellerConflictException;
import com.revibeflip.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock private CartRepository cartRepository;
    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private OrderItemRepository orderItemRepository;
    @Mock private DeliveryRepository deliveryRepository;
    @Mock private NotificationRepository notificationRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private PlatformSettingRepository platformSettingRepository;
    @Mock private ChatService chatService;

    private NotificationService notificationService;
    private CartService cartService;

    private User buyer;
    private User seller1;
    private User seller2;
    private Product product1;
    private Product product2;
    private Product productOfSeller2;
    private Cart cart;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService(notificationRepository, messagingTemplate);
        cartService = new CartService(
                cartRepository,
                cartItemRepository,
                productRepository,
                orderRepository,
                orderItemRepository,
                deliveryRepository,
                notificationService,
                platformSettingRepository,
                chatService
        );

        buyer = User.builder()
                .id(1L)
                .firstName("Awa")
                .lastName("Ndiaye")
                .phone("+221771111111")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        seller1 = User.builder()
                .id(2L)
                .firstName("Aminata")
                .lastName("Diallo")
                .phone("+221772222222")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        seller2 = User.builder()
                .id(3L)
                .firstName("Moussa")
                .lastName("Fall")
                .phone("+221773333333")
                .role(Role.ROLE_USER)
                .isSuspended(false)
                .build();

        product1 = Product.builder()
                .id(101L)
                .title("Robe Soie")
                .price(BigDecimal.valueOf(15000))
                .status(ProductStatus.ACTIVE)
                .seller(seller1)
                .build();

        product2 = Product.builder()
                .id(102L)
                .title("Sac Cuir")
                .price(BigDecimal.valueOf(25000))
                .status(ProductStatus.ACTIVE)
                .seller(seller1)
                .build();

        productOfSeller2 = Product.builder()
                .id(201L)
                .title("Montre Vintage")
                .price(BigDecimal.valueOf(30000))
                .status(ProductStatus.ACTIVE)
                .seller(seller2)
                .build();

        cart = Cart.builder()
                .id(1L)
                .buyer(buyer)
                .seller(null)
                .items(new ArrayList<>())
                .build();

        lenient().when(cartRepository.findByBuyerId(buyer.getId())).thenReturn(Optional.of(cart));
        lenient().when(cartRepository.save(any(Cart.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    @DisplayName("Ajout d'un premier article au panier réussi")
    void addToCart_success() {
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(orderRepository.existsByProductIdAndStatusIn(eq(101L), any())).thenReturn(false);

        AddToCartRequest req = new AddToCartRequest(101L, false);
        CartDto dto = cartService.addToCart(buyer, req);

        assertThat(dto.getItemCount()).isEqualTo(1);
        assertThat(dto.getSellerId()).isEqualTo(seller1.getId());
        assertThat(dto.getSubtotal()).isEqualByComparingTo("15000");
        assertThat(dto.getItems()).hasSize(1);
    }

    @Test
    @DisplayName("Règle mono-vendeur : l'ajout d'un article d'un autre vendeur lève SellerConflictException")
    void addToCart_monoVendeurConflict_throwsSellerConflictException() {
        // Pré-remplir le panier avec un article du vendeur 1
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());

        when(productRepository.findById(201L)).thenReturn(Optional.of(productOfSeller2));
        when(orderRepository.existsByProductIdAndStatusIn(eq(201L), any())).thenReturn(false);

        AddToCartRequest req = new AddToCartRequest(201L, false);

        assertThatThrownBy(() -> cartService.addToCart(buyer, req))
                .isInstanceOf(SellerConflictException.class)
                .hasMessageContaining("Votre panier contient déjà des articles de Aminata Diallo");
    }

    @Test
    @DisplayName("Règle mono-vendeur : forceReplaceSeller vide le panier précédent et ajoute le nouvel article")
    void addToCart_forceReplaceSeller_clearsPreviousAndAddsNew() {
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());

        when(productRepository.findById(201L)).thenReturn(Optional.of(productOfSeller2));
        when(orderRepository.existsByProductIdAndStatusIn(eq(201L), any())).thenReturn(false);

        AddToCartRequest req = new AddToCartRequest(201L, true);
        CartDto dto = cartService.addToCart(buyer, req);

        assertThat(dto.getItemCount()).isEqualTo(1);
        assertThat(dto.getSellerId()).isEqualTo(seller2.getId());
        assertThat(dto.getItems().get(0).getProductId()).isEqualTo(201L);
    }

    @Test
    @DisplayName("Règle seconde main : rejet de l'ajout en doublon du même article")
    void addToCart_duplicateItem_throwsIllegalStateException() {
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());

        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(orderRepository.existsByProductIdAndStatusIn(eq(101L), any())).thenReturn(false);

        AddToCartRequest req = new AddToCartRequest(101L, false);

        assertThatThrownBy(() -> cartService.addToCart(buyer, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà dans votre panier");
    }

    @Test
    @DisplayName("Rejet : un acheteur ne peut pas ajouter ses propres articles")
    void addToCart_ownItem_throwsIllegalArgumentException() {
        product1.setSeller(buyer);
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));

        AddToCartRequest req = new AddToCartRequest(101L, false);

        assertThatThrownBy(() -> cartService.addToCart(buyer, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("propre article");
    }

    @Test
    @DisplayName("Rejet : ajout d'un article qui n'est plus ACTIVE")
    void addToCart_inactiveItem_throwsIllegalStateException() {
        product1.setStatus(ProductStatus.SOLD);
        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));

        AddToCartRequest req = new AddToCartRequest(101L, false);

        assertThatThrownBy(() -> cartService.addToCart(buyer, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("plus disponible à l'achat");
    }

    @Test
    @DisplayName("Rejet : acheteur suspendu ne peut pas utiliser le panier")
    void addToCart_suspendedBuyer_throwsIllegalStateException() {
        buyer.setIsSuspended(true);
        AddToCartRequest req = new AddToCartRequest(101L, false);

        assertThatThrownBy(() -> cartService.addToCart(buyer, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("suspendu");
    }

    @Test
    @DisplayName("Suppression d'article et remise à zéro du vendeur si panier vide")
    void removeFromCart_success() {
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());

        CartDto dto = cartService.removeFromCart(buyer, 101L);

        assertThat(dto.getItemCount()).isEqualTo(0);
        assertThat(dto.getSellerId()).isNull();
    }

    @Test
    @DisplayName("Vider le panier")
    void clearCart_success() {
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());
        cart.getItems().add(CartItem.builder().cart(cart).product(product2).build());

        CartDto dto = cartService.clearCart(buyer);

        assertThat(dto.getItemCount()).isEqualTo(0);
        assertThat(dto.getItems()).isEmpty();
        assertThat(dto.getSellerId()).isNull();
    }

    @Test
    @DisplayName("Checkout panier multi-articles : frais de livraison facturés une seule fois (2000 FCFA), frais de validation 1%")
    void checkoutCart_singleDeliveryFeeAndValidationCalculated() {
        // Panier avec 2 articles du vendeur 1 : 15 000 + 25 000 = 40 000 FCFA
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());
        cart.getItems().add(CartItem.builder().cart(cart).product(product2).build());

        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(productRepository.findById(102L)).thenReturn(Optional.of(product2));
        when(orderRepository.existsByProductIdAndStatusIn(anyLong(), any())).thenReturn(false);

        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(999L);
            return o;
        });

        CreateOrderFromCartRequest req = new CreateOrderFromCartRequest();
        req.setDeliveryMode(DeliveryMode.HOME_DELIVERY);
        req.setDeliveryAddress("Mermoz, Dakar");
        req.setDeliveryCity("Dakar");
        req.setDeliveryPhone("+221771111111");

        OrderDto orderDto = cartService.checkoutCart(buyer, req);

        // Sous-total articles = 40 000 FCFA
        assertThat(orderDto.getItemPrice()).isEqualByComparingTo("40000");
        // Frais de validation 1% = 400 FCFA
        assertThat(orderDto.getValidationFee()).isEqualByComparingTo("400");
        // Frais de livraison comptés UNE SEULE FOIS = 2000 FCFA
        assertThat(orderDto.getDeliveryFee()).isEqualByComparingTo("2000");
        // Total = 40000 + 400 + 2000 = 42400 FCFA
        assertThat(orderDto.getTotalAmount()).isEqualByComparingTo("42400");
        // Commission plateforme 20% sur les articles = 8000 FCFA
        assertThat(orderDto.getPlatformCommission()).isEqualByComparingTo("8000");
        // Gain net vendeur = 40000 - 8000 = 32000 FCFA
        assertThat(orderDto.getSellerPayout()).isEqualByComparingTo("32000");
        // 2 articles dans la commande
        assertThat(orderDto.getItemCount()).isEqualTo(2);

        // Le panier de l'acheteur a bien été vidé après checkout
        assertThat(cart.getItems()).isEmpty();
        assertThat(cart.getSeller()).isNull();
    }

    @Test
    @DisplayName("Checkout rejeté si un des articles du panier est devenu indisponible")
    void checkoutCart_itemBecameUnavailable_throwsIllegalStateException() {
        product2.setStatus(ProductStatus.SOLD);
        cart.setSeller(seller1);
        cart.getItems().add(CartItem.builder().cart(cart).product(product1).build());
        cart.getItems().add(CartItem.builder().cart(cart).product(product2).build());

        when(productRepository.findById(101L)).thenReturn(Optional.of(product1));
        when(productRepository.findById(102L)).thenReturn(Optional.of(product2));

        CreateOrderFromCartRequest req = new CreateOrderFromCartRequest();
        req.setDeliveryMode(DeliveryMode.HOME_DELIVERY);
        req.setDeliveryAddress("Dakar");
        req.setDeliveryCity("Dakar");
        req.setDeliveryPhone("+221771111111");

        assertThatThrownBy(() -> cartService.checkoutCart(buyer, req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("n'est plus disponible");
    }
}
