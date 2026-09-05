package com.revibeflip.config;

import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.ProductCondition;
import com.revibeflip.entity.enums.ProductStatus;
import com.revibeflip.entity.enums.Role;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.CountryRepository;
import com.revibeflip.repository.ProductRepository;
import com.revibeflip.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedCountries();
        seedCategories();
        seedUsersAndProducts();
    }

    private void seedCountries() {
        if (countryRepository.count() > 0) return;

        List<Country> countries = List.of(
                Country.builder().code("SN").name("Sénégal").phoneCode("+221").currency("XOF").flagEmoji("🇸🇳").active(true).build(),
                Country.builder().code("CI").name("Côte d'Ivoire").phoneCode("+225").currency("XOF").flagEmoji("🇨🇮").active(true).build(),
                Country.builder().code("ML").name("Mali").phoneCode("+223").currency("XOF").flagEmoji("🇲🇱").active(true).build(),
                Country.builder().code("BF").name("Burkina Faso").phoneCode("+226").currency("XOF").flagEmoji("🇧🇫").active(true).build(),
                Country.builder().code("GN").name("Guinée").phoneCode("+224").currency("GNF").flagEmoji("🇬🇳").active(true).build(),
                Country.builder().code("BJ").name("Bénin").phoneCode("+229").currency("XOF").flagEmoji("🇧🇯").active(true).build(),
                Country.builder().code("TG").name("Togo").phoneCode("+228").currency("XOF").flagEmoji("🇹🇬").active(true).build(),
                Country.builder().code("NE").name("Niger").phoneCode("+227").currency("XOF").flagEmoji("🇳🇪").active(true).build(),
                Country.builder().code("MR").name("Mauritanie").phoneCode("+222").currency("MRU").flagEmoji("🇲🇷").active(true).build(),
                Country.builder().code("CM").name("Cameroun").phoneCode("+237").currency("XAF").flagEmoji("🇨🇲").active(true).build(),
                Country.builder().code("MA").name("Maroc").phoneCode("+212").currency("MAD").flagEmoji("🇲🇦").active(true).build(),
                Country.builder().code("GH").name("Ghana").phoneCode("+233").currency("GHS").flagEmoji("🇬🇭").active(true).build(),
                Country.builder().code("NG").name("Nigeria").phoneCode("+234").currency("NGN").flagEmoji("🇳🇬").active(true).build(),
                Country.builder().code("AUTRE").name("Autre pays d'Afrique").phoneCode("+000").currency("XOF").flagEmoji("🌍").active(true).build()
        );

        countryRepository.saveAll(countries);
        log.info("Pays africains initialisés avec succès.");
    }

    private void seedCategories() {
        if (categoryRepository.count() > 0) return;

        List<Category> categories = List.of(
                Category.builder().name("Femmes").slug("femmes").icon("Sparkles").description("Vêtements, robes, jupes et ensembles femmes").displayOrder(1).active(true).build(),
                Category.builder().name("Hommes").slug("hommes").icon("Shirt").description("Chemises, t-shirts, costumes et pantalons hommes").displayOrder(2).active(true).build(),
                Category.builder().name("Mode Traditionnelle & Wax").slug("traditionnel-wax").icon("Palette").description("Boubous brodés, pagnes, Bazin riche, tenues traditionnelles").displayOrder(3).active(true).build(),
                Category.builder().name("Chaussures").slug("chaussures").icon("Footprints").description("Baskets, sneakers, sandales en cuir et talons").displayOrder(4).active(true).build(),
                Category.builder().name("Accessoires & Maroquinerie").slug("accessoires").icon("Watch").description("Sacs à main, montres, ceintures, bijoux").displayOrder(5).active(true).build(),
                Category.builder().name("Enfants & Bébés").slug("enfants").icon("Baby").description("Vêtements et chaussures pour garçons et filles").displayOrder(6).active(true).build()
        );

        categoryRepository.saveAll(categories);
        log.info("Catégories initialisées avec succès.");
    }

    private void seedUsersAndProducts() {
        if (userRepository.count() > 0) return;

        Country senegal = countryRepository.findByCode("SN").orElse(null);
        Category traditionnel = categoryRepository.findBySlug("traditionnel-wax").orElse(null);
        Category femmes = categoryRepository.findBySlug("femmes").orElse(null);
        Category hommes = categoryRepository.findBySlug("hommes").orElse(null);
        Category chaussures = categoryRepository.findBySlug("chaussures").orElse(null);
        Category accessoires = categoryRepository.findBySlug("accessoires").orElse(null);

        // 1. Admin
        User admin = User.builder()
                .firstName("Super")
                .lastName("Admin")
                .phone("+221770000000")
                .email("admin@revibeflip.com")
                .password(passwordEncoder.encode("Admin1234!"))
                .role(Role.ROLE_ADMIN)
                .country(senegal)
                .isVerified(true)
                .city("Dakar")
                .trustScore(100.0)
                .rating(5.0)
                .reviewCount(0)
                .build();
        userRepository.save(admin);

        // 2. Seller Aminata
        User aminata = User.builder()
                .firstName("Aminata")
                .lastName("Diallo")
                .phone("+221771112233")
                .email("aminata@revibeflip.com")
                .password(passwordEncoder.encode("Passer123!"))
                .role(Role.ROLE_USER)
                .country(senegal)
                .isVerified(true)
                .city("Dakar")
                .trustScore(98.0)
                .rating(4.9)
                .reviewCount(24)
                .profilePicture("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
                .build();
        aminata = userRepository.save(aminata);

        // 3. Seller Moussa
        User moussa = User.builder()
                .firstName("Moussa")
                .lastName("Ndiaye")
                .phone("+221774445566")
                .email("moussa@revibeflip.com")
                .password(passwordEncoder.encode("Passer123!"))
                .role(Role.ROLE_USER)
                .country(senegal)
                .isVerified(true)
                .city("Dakar")
                .trustScore(95.0)
                .rating(4.8)
                .reviewCount(16)
                .profilePicture("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80")
                .build();
        moussa = userRepository.save(moussa);

        // 4. Buyer Fatou
        User fatou = User.builder()
                .firstName("Fatou")
                .lastName("Sow")
                .phone("+221778889900")
                .email("fatou@revibeflip.com")
                .password(passwordEncoder.encode("Passer123!"))
                .role(Role.ROLE_USER)
                .country(senegal)
                .isVerified(true)
                .city("Dakar Almadies")
                .trustScore(100.0)
                .rating(5.0)
                .reviewCount(5)
                .profilePicture("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80")
                .build();
        userRepository.save(fatou);

        log.info("Utilisateurs initiaux créés (Admin + Vendeurs + Acheteur).");

        // Seed realistic Senegalese listings
        List<Product> products = new ArrayList<>();

        // Product 1: Grand Boubou Bazin
        Product p1 = Product.builder()
                .title("Grand Boubou Brodé 3 Pièces Bazin Riche Getzner")
                .description("Magnifique grand boubou brodé à la main en Bazin riche bleu nuit avec fil d'or. Porté une seule fois lors d'un baptême. État impeccable.")
                .price(BigDecimal.valueOf(35000))
                .originalPrice(BigDecimal.valueOf(65000))
                .brand("Artisan Dakar")
                .size("L / XL")
                .color("Bleu Nuit & Or")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(traditionnel)
                .country(senegal)
                .locationCity("Dakar Plateau")
                .viewCount(142)
                .images(new ArrayList<>())
                .build();
        p1.getImages().add(ProductImage.builder().product(p1).imageUrl("https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        p1.getImages().add(ProductImage.builder().product(p1).imageUrl("https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?auto=format&fit=crop&w=800&q=80").isPrimary(false).displayOrder(1).build());
        products.add(p1);

        // Product 2: Robe Wax Woodin
        Product p2 = Product.builder()
                .title("Robe Évasée Chic en Wax Authentique Woodin")
                .description("Robe courte cintrée à la taille réalisée sur mesure avec un véritable tissu Woodin aux motifs floraux vifs. Finitions soignées.")
                .price(BigDecimal.valueOf(18500))
                .originalPrice(BigDecimal.valueOf(30000))
                .brand("Woodin Couture")
                .size("M")
                .color("Orange & Violet")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(femmes)
                .country(senegal)
                .locationCity("Dakar Mermoz")
                .viewCount(89)
                .images(new ArrayList<>())
                .build();
        p2.getImages().add(ProductImage.builder().product(p2).imageUrl("https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p2);

        // Product 3: Nike Air Max
        Product p3 = Product.builder()
                .title("Baskets Nike Air Max 90 Blanc / Gris")
                .description("Sneakers Nike Air Max 90 authentiques en pointure 43. Très peu portées, semelle en excellent état, boîte d'origine fournie.")
                .price(BigDecimal.valueOf(28000))
                .originalPrice(BigDecimal.valueOf(60000))
                .brand("Nike")
                .size("43")
                .color("Blanc & Gris")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(chaussures)
                .country(senegal)
                .locationCity("Dakar Sacré-Cœur")
                .viewCount(210)
                .images(new ArrayList<>())
                .build();
        p3.getImages().add(ProductImage.builder().product(p3).imageUrl("https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p3);

        // Product 4: Sac en cuir artisanal
        Product p4 = Product.builder()
                .title("Sac Cabas Cuir Véritable de Ngaye Mékhé & Wax")
                .description("Sac bandoulière fait main par les maîtres maroquiniers de Ngaye Mékhé. Cuir tanné naturel robuste avec doublure intérieure Wax imperméabilisée.")
                .price(BigDecimal.valueOf(15000))
                .originalPrice(BigDecimal.valueOf(25000))
                .brand("Maroquinerie Ngaye")
                .size("Unique")
                .color("Camel & Motifs Africains")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(accessoires)
                .country(senegal)
                .locationCity("Dakar Plateau")
                .viewCount(76)
                .images(new ArrayList<>())
                .build();
        p4.getImages().add(ProductImage.builder().product(p4).imageUrl("https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p4);

        // Product 5: Chemise Lin & Wax Homme
        Product p5 = Product.builder()
                .title("Chemise Col Mao Lin Blanc et Détails Wax")
                .description("Chemise légère et élégante pour homme, col mao avec empiècement Wax raffiné sur la poche et les poignets. Idéale pour les sorties ou le bureau.")
                .price(BigDecimal.valueOf(12500))
                .originalPrice(BigDecimal.valueOf(20000))
                .brand("AfroStyle")
                .size("L")
                .color("Blanc & Wax Bleu")
                .condition(ProductCondition.GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(hommes)
                .country(senegal)
                .locationCity("Dakar Ouakam")
                .viewCount(65)
                .images(new ArrayList<>())
                .build();
        p5.getImages().add(ProductImage.builder().product(p5).imageUrl("https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p5);

        // Product 6: Sandales Cuir Touareg
        Product p6 = Product.builder()
                .title("Sandales Cuir Authentique Touareg Cousues Main")
                .description("Paire de sandales en cuir véritable, très confortables et solides. Semelle résistante. Pointure 42.")
                .price(BigDecimal.valueOf(9500))
                .originalPrice(BigDecimal.valueOf(16000))
                .brand("Artisanat")
                .size("42")
                .color("Marron foncé")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(chaussures)
                .country(senegal)
                .locationCity("Thiès")
                .viewCount(48)
                .images(new ArrayList<>())
                .build();
        p6.getImages().add(ProductImage.builder().product(p6).imageUrl("https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p6);

        productRepository.saveAll(products);
        log.info("Annonces initiales sénégalaises insérées avec succès ({} articles).", products.size());
    }
}
