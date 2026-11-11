package com.revibeflip.config;

import com.revibeflip.entity.*;
import com.revibeflip.entity.enums.*;
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
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Initialisateur principal des données de démarrage de l'application ReVibe FliP.
 * <p>
 * S'exécute à chaque démarrage via {@link CommandLineRunner} pour initialiser de façon idempotente :
 * <ul>
 *   <li>Les pays africains gérés (Sénégal SN +221, Côte d'Ivoire, Mali, etc.).</li>
 *   <li>Les catégories et sous-catégories du catalogue (Mode femme, homme, tenues traditionnelles Wax, etc.).</li>
 *   <li>Les 4 utilisateurs de démonstration (Super Admin, Aminata Diallo, Moussa Ndiaye, Fatou Sow).</li>
 *   <li>Le catalogue initial d'annonces avec prix en FCFA, états d'usure et photos.</li>
 * </ul>
 * </p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final com.revibeflip.repository.OrderRepository orderRepository;
    private final com.revibeflip.repository.PaymentRepository paymentRepository;
    private final com.revibeflip.repository.ReportRepository reportRepository;
    private final com.revibeflip.repository.AdminActionLogRepository adminActionLogRepository;
    private final com.revibeflip.repository.PlatformSettingRepository platformSettingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedPlatformSettings();
        seedCountries();
        seedCategories();
        seedUsersAndProducts();
        seedOrdersAndAudit();
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
                Category.builder().name("Enfants & Bébés").slug("enfants").icon("Baby").description("Vêtements et chaussures pour garçons et filles").displayOrder(6).active(true).build(),
                Category.builder().name("Robes & Soirées").slug("robes").icon("Heart").description("Robes de soirée, cocktails, tenues de fête").displayOrder(7).active(true).build(),
                Category.builder().name("Maison & Décoration").slug("maison-deco").icon("Home").description("Artisanat d'art et linge de maison").displayOrder(8).active(true).build(),
                Category.builder().name("Grandes Tailles & Curvy").slug("grandes-tailles").icon("Smile").description("Mode grande taille et coupes confortables").displayOrder(9).active(true).build(),
                Category.builder().name("Sportswear & Fitness").slug("sportswear").icon("Activity").description("Tenues de sport, leggings et sneakers running").displayOrder(10).active(true).build(),
                Category.builder().name("Beauté & Bien-être").slug("beaute-soins").icon("Feather").description("Soins cosmétiques naturels, parfums et huiles précieuses").displayOrder(11).active(true).build(),
                Category.builder().name("Bijoux & Montres").slug("bijoux").icon("Gem").description("Colliers en or, argent 925, perles et montres").displayOrder(12).active(true).build(),
                Category.builder().name("Jeans & Denims").slug("jeans").icon("Layers").description("Jeans Levi's, vestes en jean et denim").displayOrder(13).active(true).build(),
                Category.builder().name("Lingerie & Nuit").slug("lingerie").icon("Moon").description("Pyjamas, kimonos de nuit et lingerie").displayOrder(14).active(true).build(),
                Category.builder().name("Vestes & Blazers").slug("vestes").icon("Shield").description("Blazers chics, vestes kimono et tailleurs").displayOrder(15).active(true).build(),
                Category.builder().name("Créateurs Locaux").slug("createurs").icon("Award").description("Pièces uniques et sur-mesure d'artisans sénégalais").displayOrder(16).active(true).build()
        );

        categoryRepository.saveAll(categories);
        log.info("Catégories initialisées avec succès (16 catégories).");
    }

    private void seedUsersAndProducts() {
        Country senegal = countryRepository.findByCode("SN").orElse(null);
        Category traditionnel = categoryRepository.findBySlug("traditionnel-wax").orElse(null);
        Category femmes = categoryRepository.findBySlug("femmes").orElse(null);
        Category hommes = categoryRepository.findBySlug("hommes").orElse(null);
        Category chaussures = categoryRepository.findBySlug("chaussures").orElse(null);
        Category accessoires = categoryRepository.findBySlug("accessoires").orElse(null);

        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        User fatou = userRepository.findByPhone("+221778889900").orElse(null);

        // 1. Admin
        if (userRepository.findByPhone("+221770000000").isEmpty()) {
            User admin = User.builder()
                    .firstName("Super")
                    .lastName("Admin")
                    .phone("+221770000000")
                    .email("admin@revibeflip.com")
                    .password(passwordEncoder.encode("Admin1234!"))
                    .role(Role.ROLE_ADMIN)
                    .country(senegal)
                    .isVerified(true)
                    .isSuspended(false)
                    .city("Dakar")
                    .trustScore(100.0)
                    .rating(5.0)
                    .reviewCount(0)
                    .build();
            userRepository.save(admin);
        }

        // 2. Seller Aminata
        if (aminata == null) {
            aminata = User.builder()
                    .firstName("Aminata")
                    .lastName("Diallo")
                    .phone("+221771112233")
                    .email("aminata@revibeflip.com")
                    .password(passwordEncoder.encode("Passer123!"))
                    .role(Role.ROLE_USER)
                    .country(senegal)
                    .isVerified(true)
                    .isSuspended(false)
                    .city("Dakar")
                    .trustScore(98.0)
                    .rating(4.9)
                    .reviewCount(24)
                    .profilePicture("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
                    .build();
            aminata = userRepository.save(aminata);
        } else {
            aminata.setPassword(passwordEncoder.encode("Passer123!"));
            aminata.setIsVerified(true);
            aminata.setIsSuspended(false);
            aminata = userRepository.save(aminata);
        }

        // 3. Seller Moussa
        if (moussa == null) {
            moussa = User.builder()
                    .firstName("Moussa")
                    .lastName("Ndiaye")
                    .phone("+221774445566")
                    .email("moussa@revibeflip.com")
                    .password(passwordEncoder.encode("Passer123!"))
                    .role(Role.ROLE_USER)
                    .country(senegal)
                    .isVerified(true)
                    .isSuspended(false)
                    .city("Dakar")
                    .trustScore(95.0)
                    .rating(4.8)
                    .reviewCount(16)
                    .profilePicture("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80")
                    .build();
            moussa = userRepository.save(moussa);
        } else {
            moussa.setPassword(passwordEncoder.encode("Passer123!"));
            moussa.setIsVerified(true);
            moussa.setIsSuspended(false);
            moussa = userRepository.save(moussa);
        }

        // 4. Buyer Fatou
        if (fatou == null) {
            fatou = User.builder()
                    .firstName("Fatou")
                    .lastName("Sow")
                    .phone("+221778889900")
                    .email("fatou@revibeflip.com")
                    .password(passwordEncoder.encode("Passer123!"))
                    .role(Role.ROLE_USER)
                    .country(senegal)
                    .isVerified(true)
                    .isSuspended(false)
                    .city("Dakar Almadies")
                    .trustScore(100.0)
                    .rating(5.0)
                    .reviewCount(5)
                    .profilePicture("https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80")
                    .build();
            fatou = userRepository.save(fatou);
        } else {
            fatou.setPassword(passwordEncoder.encode("Passer123!"));
            fatou.setIsVerified(true);
            fatou.setIsSuspended(false);
            fatou = userRepository.save(fatou);
        }

        log.info("Comptes de test (Admin + Aminata + Moussa + Fatou) vérifiés et prêts.");

        if (productRepository.count() > 0 || aminata == null || moussa == null) return;

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

        // Product 7: Robe Maxi Fleurie Bohème
        Product p7 = Product.builder()
                .title("Robe Maxi Fleurie Bohème en Mousseline")
                .description("Robe longue très fluide à motifs floraux, col en V et taille élastiquée. Portée 2 fois pour un brunch aux Almadies. Comme neuve.")
                .price(BigDecimal.valueOf(14000))
                .originalPrice(BigDecimal.valueOf(28000))
                .brand("Zara")
                .size("M")
                .color("Vert d'eau & Rose")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(femmes)
                .country(senegal)
                .locationCity("Dakar Almadies")
                .viewCount(112)
                .images(new ArrayList<>())
                .build();
        p7.getImages().add(ProductImage.builder().product(p7).imageUrl("https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p7);

        // Product 8: Sneakers Adidas Stan Smith
        Product p8 = Product.builder()
                .title("Sneakers Adidas Stan Smith Cuir Blanc / Vert")
                .description("Classique intemporel Stan Smith avec languette verte. Cuir nettoyé et soigné. Semelle en très bon état. Pointure 41.")
                .price(BigDecimal.valueOf(22000))
                .originalPrice(BigDecimal.valueOf(45000))
                .brand("Adidas")
                .size("41")
                .color("Blanc & Vert")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(chaussures)
                .country(senegal)
                .locationCity("Dakar Sacré-Cœur")
                .viewCount(135)
                .images(new ArrayList<>())
                .build();
        p8.getImages().add(ProductImage.builder().product(p8).imageUrl("https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p8);

        // Product 9: Ensemble Tailleur Lilas
        Product p9 = Product.builder()
                .title("Ensemble Veste Tailleur & Pantalon Cintrée")
                .description("Tailleur 2 pièces ultra élégant couleur lilas pastel. Coupe moderne tendance. Idéal pour cocktail ou travail.")
                .price(BigDecimal.valueOf(26500))
                .originalPrice(BigDecimal.valueOf(50000))
                .brand("Mango")
                .size("S / M")
                .color("Lilas Pastel")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(femmes)
                .country(senegal)
                .locationCity("Dakar Point E")
                .viewCount(168)
                .images(new ArrayList<>())
                .build();
        p9.getImages().add(ProductImage.builder().product(p9).imageUrl("https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p9);

        // Product 10: Polo Ralph Lauren
        Product p10 = Product.builder()
                .title("T-shirt Polo Ralph Lauren Classic Fit Noir")
                .description("Authentique polo Ralph Lauren en coton piqué respirant, logo brodé rouge. Porté très rarement, coupe impeccable.")
                .price(BigDecimal.valueOf(16000))
                .originalPrice(BigDecimal.valueOf(38000))
                .brand("Ralph Lauren")
                .size("XL")
                .color("Noir")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(hommes)
                .country(senegal)
                .locationCity("Dakar Mermoz")
                .viewCount(94)
                .images(new ArrayList<>())
                .build();
        p10.getImages().add(ProductImage.builder().product(p10).imageUrl("https://images.unsplash.com/photo-1625910513413-7223b207eb3d?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p10);

        // Product 11: Montre Minimaliste
        Product p11 = Product.builder()
                .title("Montre Minimaliste Bracelet Cuir Véritable Doré")
                .description("Montre élégante cadran épuré blanc et boîtier doré rose avec bracelet cuir souple marron. Pile neuve installée.")
                .price(BigDecimal.valueOf(13500))
                .originalPrice(BigDecimal.valueOf(32000))
                .brand("Cluse")
                .size("Unique")
                .color("Doré Rose & Marron")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(fatou)
                .category(accessoires)
                .country(senegal)
                .locationCity("Dakar Fann")
                .viewCount(88)
                .images(new ArrayList<>())
                .build();
        p11.getImages().add(ProductImage.builder().product(p11).imageUrl("https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p11);

        // Product 12: Jean Levi's 501
        Product p12 = Product.builder()
                .title("Jean Levi's 501 Original Coupe Droite Vintage")
                .description("Véritable jean Levi's 501 denim brut délavé vintage. Robuste, coutures renforcées. Taille W32 L32.")
                .price(BigDecimal.valueOf(18000))
                .originalPrice(BigDecimal.valueOf(42000))
                .brand("Levi's")
                .size("W32 / L32")
                .color("Bleu Brut Vintage")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(hommes)
                .country(senegal)
                .locationCity("Dakar Ouakam")
                .viewCount(154)
                .images(new ArrayList<>())
                .build();
        p12.getImages().add(ProductImage.builder().product(p12).imageUrl("https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p12);

        // Product 13: Robe Fille Cérémonie
        Category enfantsCat = categoryRepository.findBySlug("enfants").orElse(femmes);
        Product p13 = Product.builder()
                .title("Robe Trapèze Petite Fille Cérémonie en Dentelle")
                .description("Adorable robe pour fillette de 4-5 ans avec tulle et jolie broderie. Portée uniquement pour une séance photo.")
                .price(BigDecimal.valueOf(8500))
                .originalPrice(BigDecimal.valueOf(18000))
                .brand("Okaïdi")
                .size("4-5 ans")
                .color("Blanc Crème & Pêche")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(enfantsCat)
                .country(senegal)
                .locationCity("Dakar Yoff")
                .viewCount(63)
                .images(new ArrayList<>())
                .build();
        p13.getImages().add(ProductImage.builder().product(p13).imageUrl("https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p13);

        // Product 14: Mini Sac Bandoulière
        Product p14 = Product.builder()
                .title("Mini Sac Bandoulière Matelassé Chaîne Dorée")
                .description("Petit sac à main chic style luxe matelassé noir avec rabat et chaîne dorée. Idéal pour vos soirées et mariages.")
                .price(BigDecimal.valueOf(9900))
                .originalPrice(BigDecimal.valueOf(22000))
                .brand("Parfois")
                .size("Unique")
                .color("Noir & Or")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(fatou)
                .category(accessoires)
                .country(senegal)
                .locationCity("Dakar Plateau")
                .viewCount(128)
                .images(new ArrayList<>())
                .build();
        p14.getImages().add(ProductImage.builder().product(p14).imageUrl("https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p14);

        // Product 15: Bazin Riche Teinté Artisanal
        Product p15 = Product.builder()
                .title("Ensemble Bazin Riche Teinté Artisanal Vert Émeraude")
                .description("Superbe 2 pièces pagne et haut en Bazin riche teinté artisanalement au Sénégal. Reflets soyeux magnifiques.")
                .price(BigDecimal.valueOf(32000))
                .originalPrice(BigDecimal.valueOf(55000))
                .brand("Couture Dakar")
                .size("L")
                .color("Vert Émeraude")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(traditionnel)
                .country(senegal)
                .locationCity("Dakar Médina")
                .viewCount(175)
                .images(new ArrayList<>())
                .build();
        p15.getImages().add(ProductImage.builder().product(p15).imageUrl("https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p15);

        // Product 16: Nike Dunk Low Panda
        Product p16 = Product.builder()
                .title("Baskets Nike Dunk Low Retro Noir & Blanc (Panda)")
                .description("L'indispensable sneaker Dunk Low Panda pointure 42. Très bon état, portées avec soin, semelles propres.")
                .price(BigDecimal.valueOf(34000))
                .originalPrice(BigDecimal.valueOf(75000))
                .brand("Nike")
                .size("42")
                .color("Noir & Blanc")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(chaussures)
                .country(senegal)
                .locationCity("Dakar Ngor")
                .viewCount(240)
                .images(new ArrayList<>())
                .build();
        p16.getImages().add(ProductImage.builder().product(p16).imageUrl("https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p16);

        // Product 17: Kimono Wax Vlisco
        Product p17 = Product.builder()
                .title("Veste Kimono Courte en Véritable Wax Vlisco")
                .description("Veste kimono moderne et légère pouvant s'associer avec un jean ou une robe noire. Création artisanale soignée.")
                .price(BigDecimal.valueOf(15500))
                .originalPrice(BigDecimal.valueOf(28000))
                .brand("Vlisco Original")
                .size("Taille Unique")
                .color("Bleu & Jaune Solaire")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(traditionnel)
                .country(senegal)
                .locationCity("Dakar Mermoz")
                .viewCount(92)
                .images(new ArrayList<>())
                .build();
        p17.getImages().add(ProductImage.builder().product(p17).imageUrl("https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p17);

        // Product 18: Chemise Lin Massimo Dutti
        Product p18 = Product.builder()
                .title("Chemise Casual Homme en Lin Écru Respirant")
                .description("Chemise coupe régulière en lin doux naturel. Très agréable par temps chaud à Dakar, boutonnage en nacre.")
                .price(BigDecimal.valueOf(11000))
                .originalPrice(BigDecimal.valueOf(24000))
                .brand("Massimo Dutti")
                .size("M")
                .color("Écru Naturel")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(hommes)
                .country(senegal)
                .locationCity("Dakar Almadies")
                .viewCount(81)
                .images(new ArrayList<>())
                .build();
        p18.getImages().add(ProductImage.builder().product(p18).imageUrl("https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p18);

        // Product 19: Collier Carte Afrique Argent
        Product p19 = Product.builder()
                .title("Collier Pendentif Carte d'Afrique en Argent 925")
                .description("Chaîne et pendentif contour Afrique finement ciselé en argent massif 925. Livré dans son écrin de protection.")
                .price(BigDecimal.valueOf(12000))
                .originalPrice(BigDecimal.valueOf(25000))
                .brand("Bijouterie Dakar")
                .size("45 cm")
                .color("Argent Brillant")
                .condition(ProductCondition.NEW_WITH_TAG)
                .status(ProductStatus.ACTIVE)
                .seller(fatou)
                .category(accessoires)
                .country(senegal)
                .locationCity("Dakar Plateau")
                .viewCount(115)
                .images(new ArrayList<>())
                .build();
        p19.getImages().add(ProductImage.builder().product(p19).imageUrl("https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p19);

        // Product 20: Lunettes Vintage Écaille
        Product p20 = Product.builder()
                .title("Lunettes de Soleil Vintage Rétro Monture Écaille")
                .description("Lunettes de soleil polarisées protection UV400, monture rétro motif écaille de tortue. Boîte rigide fournie.")
                .price(BigDecimal.valueOf(7500))
                .originalPrice(BigDecimal.valueOf(19000))
                .brand("Hawkers")
                .size("Unique")
                .color("Écaille Ambrée")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(moussa)
                .category(accessoires)
                .country(senegal)
                .locationCity("Dakar Ouakam")
                .viewCount(99)
                .images(new ArrayList<>())
                .build();
        p20.getImages().add(ProductImage.builder().product(p20).imageUrl("https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p20);

        // Product 21: Sandales Plates Dorées
        Product p21 = Product.builder()
                .title("Sandales Plates en Cuir Doré avec Bride Tressée")
                .description("Sandales d'été légères et confortables, brides tressées dorées scintillantes. Très peu portées, semelle souple.")
                .price(BigDecimal.valueOf(8900))
                .originalPrice(BigDecimal.valueOf(19500))
                .brand("Les Tropéziennes")
                .size("39")
                .color("Or Métallisé")
                .condition(ProductCondition.VERY_GOOD)
                .status(ProductStatus.ACTIVE)
                .seller(aminata)
                .category(chaussures)
                .country(senegal)
                .locationCity("Dakar Somone")
                .viewCount(87)
                .images(new ArrayList<>())
                .build();
        p21.getImages().add(ProductImage.builder().product(p21).imageUrl("https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80").isPrimary(true).displayOrder(0).build());
        products.add(p21);

        productRepository.saveAll(products);
        log.info("Annonces initiales sénégalaises insérées avec succès ({} articles).", products.size());
    }

    private void seedPlatformSettings() {
        if (platformSettingRepository.count() == 0) {
            PlatformSetting settings = PlatformSetting.builder()
                    .commissionRate(BigDecimal.valueOf(20.0))
                    .validationFeeRate(BigDecimal.valueOf(1.0))
                    .platformName("ReVibe FliP")
                    .supportEmail("contact@revibeflip.com")
                    .supportPhone("+221770000000")
                    .currency("FCFA")
                    .offerValidityHours(24)
                    .reservationDurationHours(24)
                    .demoMode(true)
                    .build();
            platformSettingRepository.save(settings);
            log.info("Paramètres de plateforme initialisés (Commission: 20%, Frais validation: 1%, Mode Démo: true).");
        }
    }

    private void seedOrdersAndAudit() {
        if (orderRepository.count() > 0) return;

        User admin = userRepository.findByPhone("+221770000000").orElse(null);
        User aminata = userRepository.findByPhone("+221771112233").orElse(null);
        User moussa = userRepository.findByPhone("+221774445566").orElse(null);
        User fatou = userRepository.findByPhone("+221778889900").orElse(null);

        List<Product> products = productRepository.findAll();
        if (products.isEmpty() || fatou == null || aminata == null || moussa == null) return;

        LocalDateTime now = LocalDateTime.now();

        // 17 commandes réalistes réparties sur 30 jours (tous statuts & 3 moyens de paiement)
        List<OrderSeedSpec> specs = List.of(
                new OrderSeedSpec(0, fatou, aminata, products.get(0), BigDecimal.valueOf(35000), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.RELEASED_TO_SELLER, 28),
                new OrderSeedSpec(1, fatou, moussa, products.get(2), BigDecimal.valueOf(28000), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.ORANGE_MONEY, EscrowStatus.RELEASED_TO_SELLER, 25),
                new OrderSeedSpec(2, fatou, aminata, products.get(1), BigDecimal.valueOf(18500), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.RELEASED_TO_SELLER, 22),
                new OrderSeedSpec(3, fatou, moussa, products.get(4), BigDecimal.valueOf(25000), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.FREE_MONEY, EscrowStatus.RELEASED_TO_SELLER, 19),
                new OrderSeedSpec(4, fatou, aminata, products.get(6), BigDecimal.valueOf(42000), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.RELEASED_TO_SELLER, 16),
                new OrderSeedSpec(5, fatou, moussa, products.get(8), BigDecimal.valueOf(12000), OrderStatus.COMPLETED, DeliveryStatus.DELIVERED, PaymentMethod.ORANGE_MONEY, EscrowStatus.RELEASED_TO_SELLER, 14),
                new OrderSeedSpec(6, fatou, aminata, products.get(3), BigDecimal.valueOf(15000), OrderStatus.CANCELLED, DeliveryStatus.CANCELLED, PaymentMethod.WAVE, EscrowStatus.REFUNDED_TO_BUYER, 12),
                new OrderSeedSpec(7, fatou, moussa, products.get(7), BigDecimal.valueOf(22000), OrderStatus.PAID_ESCROW_LOCKED, DeliveryStatus.DISPATCHED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 10),
                new OrderSeedSpec(8, fatou, aminata, products.get(5), BigDecimal.valueOf(16000), OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 8),
                new OrderSeedSpec(9, fatou, moussa, products.get(10), BigDecimal.valueOf(19500), OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 6),
                new OrderSeedSpec(10, fatou, aminata, products.get(12), BigDecimal.valueOf(31000), OrderStatus.DELIVERED, DeliveryStatus.DELIVERED, PaymentMethod.FREE_MONEY, EscrowStatus.LOCKED, 4),
                new OrderSeedSpec(11, fatou, moussa, products.get(9), BigDecimal.valueOf(14000), OrderStatus.DISPUTED, DeliveryStatus.PENDING, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 3),
                new OrderSeedSpec(12, fatou, aminata, products.get(11), BigDecimal.valueOf(27000), OrderStatus.SHIPPED, DeliveryStatus.IN_TRANSIT, PaymentMethod.WAVE, EscrowStatus.LOCKED, 2),
                new OrderSeedSpec(13, fatou, moussa, products.get(13), BigDecimal.valueOf(11500), OrderStatus.PAID_ESCROW_LOCKED, DeliveryStatus.DISPATCHED, PaymentMethod.ORANGE_MONEY, EscrowStatus.LOCKED, 1),
                new OrderSeedSpec(14, fatou, aminata, products.get(14), BigDecimal.valueOf(45000), OrderStatus.PAID_ESCROW_LOCKED, DeliveryStatus.DISPATCHED, PaymentMethod.WAVE, EscrowStatus.LOCKED, 0),
                new OrderSeedSpec(15, fatou, moussa, products.get(15), BigDecimal.valueOf(9500), OrderStatus.PENDING_PAYMENT, DeliveryStatus.PENDING, null, null, 0),
                new OrderSeedSpec(16, fatou, aminata, products.get(16), BigDecimal.valueOf(17000), OrderStatus.PENDING_PAYMENT, DeliveryStatus.PENDING, null, null, 0)
        );

        int counter = 101;
        for (OrderSeedSpec s : specs) {
            LocalDateTime orderDate = now.minusDays(s.daysAgo).minusHours((s.index * 2) % 12);
            BigDecimal itemPrice = s.price;
            BigDecimal validationFee = itemPrice.multiply(BigDecimal.valueOf(0.01)).setScale(0, java.math.RoundingMode.HALF_UP);
            BigDecimal deliveryFee = BigDecimal.valueOf(1500);
            BigDecimal totalAmount = itemPrice.add(validationFee).add(deliveryFee);
            BigDecimal commission = itemPrice.multiply(BigDecimal.valueOf(0.20)).setScale(0, java.math.RoundingMode.HALF_UP);
            BigDecimal sellerPayout = itemPrice.subtract(commission);

            Order order = Order.builder()
                    .orderNumber(String.format("RF-2026-%05d", counter++))
                    .buyer(s.buyer)
                    .seller(s.seller)
                    .product(s.product)
                    .itemPrice(itemPrice)
                    .originalPrice(itemPrice)
                    .agreedPrice(itemPrice)
                    .validationFee(validationFee)
                    .deliveryFee(deliveryFee)
                    .totalAmount(totalAmount)
                    .platformCommission(commission)
                    .sellerPayout(sellerPayout)
                    .deliveryMode(DeliveryMode.HOME_DELIVERY)
                    .deliveryAddress("Almadies Zone 4, Dakar")
                    .deliveryCity("Dakar")
                    .deliveryPhone("+221778889900")
                    .status(s.status)
                    .deliveryStatus(s.deliveryStatus)
                    .createdAt(orderDate)
                    .updatedAt(orderDate)
                    .build();

            order = orderRepository.save(order);

            if (s.paymentMethod != null && s.escrowStatus != null) {
                Payment payment = Payment.builder()
                        .order(order)
                        .paymentMethod(s.paymentMethod)
                        .transactionReference("TXN-" + System.currentTimeMillis() + "-" + s.index)
                        .amount(totalAmount)
                        .validationFee(validationFee)
                        .status(s.status == OrderStatus.CANCELLED ? PaymentStatus.REFUNDED : PaymentStatus.SUCCESS)
                        .escrowStatus(s.escrowStatus)
                        .payerPhoneNumber("+221778889900")
                        .createdAt(orderDate)
                        .paymentDate(orderDate)
                        .build();
                paymentRepository.save(payment);
            }
        }

        // Signalements de démonstration
        if (reportRepository.count() == 0) {
            Report r1 = Report.builder()
                    .reporter(fatou)
                    .reportedProduct(products.get(9))
                    .reason(ReportReason.COUNTERFEIT)
                    .details("L'étiquette sur la photo ne correspond pas à la marque déclarée.")
                    .status(ReportStatus.PENDING)
                    .createdAt(now.minusDays(2))
                    .build();

            Report r2 = Report.builder()
                    .reporter(fatou)
                    .reportedProduct(products.get(12))
                    .reason(ReportReason.MISLEADING_LISTING)
                    .details("La taille reçue est du 38 alors que l'annonce mentionnait du 42.")
                    .status(ReportStatus.PENDING)
                    .createdAt(now.minusDays(3))
                    .build();

            Report r3 = Report.builder()
                    .reporter(moussa)
                    .reportedUser(fatou)
                    .reason(ReportReason.OTHER)
                    .details("L'acheteur a demandé un paiement direct sans séquestre.")
                    .status(ReportStatus.RESOLVED)
                    .adminNotes("Rappel à l'ordre envoyé à l'utilisateur.")
                    .createdAt(now.minusDays(15))
                    .resolvedAt(now.minusDays(14))
                    .build();

            reportRepository.saveAll(List.of(r1, r2, r3));
        }

        // Actions d'audit log
        if (adminActionLogRepository.count() == 0 && admin != null) {
            List<AdminActionLog> logs = List.of(
                    AdminActionLog.builder().admin(admin).actionType("SETTINGS_UPDATE").targetType("PLATFORM_SETTING").targetId("1").details("Mise à jour du taux de commission à 20%").createdAt(now.minusDays(20)).build(),
                    AdminActionLog.builder().admin(admin).actionType("PRODUCT_STATUS_UPDATE").targetType("PRODUCT").targetId(products.get(0).getId().toString()).details("Validation manuelle annonce Bazin Riche").createdAt(now.minusDays(18)).build(),
                    AdminActionLog.builder().admin(admin).actionType("REPORT_RESOLVED").targetType("REPORT").targetId("3").details("Résolution signalement négociation hors plateforme").createdAt(now.minusDays(15)).build(),
                    AdminActionLog.builder().admin(admin).actionType("USER_REACTIVATE").targetType("USER").targetId(moussa.getId().toString()).details("Validation profil vendeur Moussa Ndiaye").createdAt(now.minusDays(10)).build(),
                    AdminActionLog.builder().admin(admin).actionType("ROLE_CHANGE").targetType("USER").targetId(admin.getId().toString()).details("Confirmation privilèges ROLE_ADMIN").createdAt(now.minusDays(5)).build()
            );
            adminActionLogRepository.saveAll(logs);
        }

        log.info("Données dev initialisées : 17 commandes réparties sur 30j (tous statuts & 3 moyens paiement), signalements et journal d'audit.");
    }

    private static class OrderSeedSpec {
        final int index;
        final User buyer;
        final User seller;
        final Product product;
        final BigDecimal price;
        final OrderStatus status;
        final DeliveryStatus deliveryStatus;
        final PaymentMethod paymentMethod;
        final EscrowStatus escrowStatus;
        final int daysAgo;

        OrderSeedSpec(int index, User buyer, User seller, Product product, BigDecimal price, OrderStatus status, DeliveryStatus deliveryStatus, PaymentMethod paymentMethod, EscrowStatus escrowStatus, int daysAgo) {
            this.index = index;
            this.buyer = buyer;
            this.seller = seller;
            this.product = product;
            this.price = price;
            this.status = status;
            this.deliveryStatus = deliveryStatus;
            this.paymentMethod = paymentMethod;
            this.escrowStatus = escrowStatus;
            this.daysAgo = daysAgo;
        }
    }
}
