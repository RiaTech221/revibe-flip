package com.revibeflip.config;

import com.revibeflip.entity.Category;
import com.revibeflip.entity.Country;
import com.revibeflip.entity.PlatformSetting;
import com.revibeflip.repository.CategoryRepository;
import com.revibeflip.repository.CountryRepository;
import com.revibeflip.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Initialisateur des données de référence (pays, catégories, paramètres plateforme) au démarrage.
 */
@Component
@Order(1)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CountryRepository countryRepository;
    private final CategoryRepository categoryRepository;
    private final PlatformSettingRepository platformSettingRepository;

    @Override
    public void run(String... args) {
        seedPlatformSettings();
        seedCountries();
        seedCategories();
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
        log.info("Pays africains initialisés.");
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
        log.info("Catégories initialisées (16 catégories).");
    }

    private void seedPlatformSettings() {
        if (platformSettingRepository.count() == 0) {
            PlatformSetting settings = PlatformSetting.builder()
                    .commissionRate(BigDecimal.valueOf(20.0))
                    .validationFeeRate(BigDecimal.valueOf(1.0))
                    .platformName("ReVibe FliP")
                    .supportEmail("contact@revibeflip.com")
                    .supportPhone("+221 77 123 45 67")
                    .currency("FCFA")
                    .offerValidityHours(24)
                    .reservationDurationHours(24)
                    .build();
            platformSettingRepository.save(settings);
            log.info("Paramètres de plateforme initialisés (Commission: 20%, Frais validation: 1%).");
        }
    }
}
