package com.revibeflip.config;

import com.revibeflip.entity.CmsPage;
import com.revibeflip.entity.FaqItem;
import com.revibeflip.entity.PageVersion;
import com.revibeflip.entity.PlatformSetting;
import com.revibeflip.entity.enums.FooterColumn;
import com.revibeflip.entity.enums.PageStatus;
import com.revibeflip.repository.CmsPageRepository;
import com.revibeflip.repository.FaqItemRepository;
import com.revibeflip.repository.PageVersionRepository;
import com.revibeflip.repository.PlatformSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class CmsDataSeeder implements CommandLineRunner {

    private final CmsPageRepository cmsPageRepository;
    private final PageVersionRepository pageVersionRepository;
    private final FaqItemRepository faqItemRepository;
    private final PlatformSettingRepository platformSettingRepository;

    @Override
    public void run(String... args) {
        seedPlatformSettings();
        seedDefaultPages();
        seedDefaultFaq();
    }

    private void seedPlatformSettings() {
        if (platformSettingRepository.count() == 0) {
            PlatformSetting s = PlatformSetting.builder()
                    .platformName("ReVibe FliP")
                    .supportEmail("contact@revibeflip.com")
                    .supportPhone("+221 77 123 45 67")
                    .supportAddress("Dakar Plateau, Sénégal")
                    .supportHours("Lundi - Samedi : 08h00 - 20h00")
                    .footerCatchphrase("La marketplace sénégalaise de seconde main dédiée aux vêtements et articles du quotidien.")
                    .footerCopyright("© {year} ReVibe FliP. Tous droits réservés.")
                    .demoMode(false)
                    .socialInstagram("https://instagram.com/revibeflip")
                    .socialFacebook("https://facebook.com/revibeflip")
                    .socialTiktok("https://tiktok.com/@revibeflip")
                    .socialWhatsapp("https://wa.me/221771234567")
                    .announcementEnabled(false)
                    .announcementMessage("🎉 Bienvenue sur ReVibe FliP : Achetez & vendez vos articles de mode à Dakar en toute sérénité !")
                    .build();
            platformSettingRepository.save(s);
            log.info("Paramètres de plateforme initiaux enregistrés.");
        }
    }

    private void seedDefaultPages() {
        if (cmsPageRepository.count() > 0) return;

        // 1. Comment ça marche
        createPageWithVersion(
                "Comment ça marche",
                "comment-ca-marche",
                """
                <h2>Bienvenue sur ReVibe FliP</h2>
                <p>ReVibe FliP est la première plateforme sénégalaise dédiée à l'achat et à la revente de vêtements, chaussures et accessoires de seconde main entre particuliers et boutiques locales.</p>

                <h3>🛍️ Acheter en 6 étapes simples</h3>
                <ol>
                  <li><strong>Trouvez votre pépite :</strong> Parcourez le catalogue par catégorie, quartier de Dakar, taille ou budget.</li>
                  <li><strong>Discutez avant d'acheter :</strong> Contactez le vendeur pour vérifier les mesures, demander des photos complémentaires ou négocier les détails.</li>
                  <li><strong>Recevez une offre personnalisée :</strong> Le vendeur vous envoie une offre claire incluant le prix convenu et le mode de livraison.</li>
                  <li><strong>Paiement sécurisé :</strong> Réglez en toute tranquillité par Wave ou Orange Money. Vos fonds ne sont pas transmis au vendeur mais gardés sous protection de la plateforme.</li>
                  <li><strong>Livraison ou remise en main propre :</strong> Suivez l'acheminement de votre colis avec le numéro de suivi direct.</li>
                  <li><strong>Validation & Déblocage des fonds :</strong> Dès réception et vérification de la conformité, confirmez votre commande pour débloquer le paiement du vendeur et laissez-lui un avis !</li>
                </ol>

                <h3>🏪 Vendre et monétiser son dressing</h3>
                <ol>
                  <li><strong>Créez votre boutique en 2 minutes :</strong> Donnez un nom à votre vitrine et renseignez votre quartier.</li>
                  <li><strong>Prenez de belles photos :</strong> Montrez l'article sous plusieurs angles, signalez les éventuels défauts pour rassurer vos acheteurs.</li>
                  <li><strong>Fixez votre prix :</strong> Vous gardez le contrôle total sur votre tarif de départ.</li>
                  <li><strong>Expédiez simplement :</strong> Confirmez la commande et confiez le colis à notre coursier partenaire ou remettez-le en main propre.</li>
                  <li><strong>Recevez vos gains :</strong> Dès que l'acheteur valide la réception, le montant net est immédiatement versé sur votre solde vendeur.</li>
                </ol>

                <div class="info-box">
                  <h4>💡 Notre modèle de commission transparente</h4>
                  <p>La publication d'annonces est 100 % gratuite. Une commission de 20 % est prélevée uniquement lors d'une vente finalisée pour couvrir les frais de fonctionnement, l'assurance acheteur et le support client.</p>
                </div>
                """,
                FooterColumn.HELP,
                1,
                false
        );

        // 2. Conditions Générales d'Utilisation (CGU)
        createPageWithVersion(
                "Conditions Générales d'Utilisation",
                "cgu",
                """
                <h2>Conditions Générales d'Utilisation (CGU)</h2>
                <p><em>Date de dernière mise à jour : 10 novembre 2026</em></p>

                <h3>1. Mentions légales et objet</h3>
                <p>La plateforme ReVibe FliP est exploitée par la société <strong>[À COMPLÉTER PAR LE PROPRIÉTAIRE : Raison Sociale, Forme Juridique, Siège social, NINEA, RCCM]</strong>.</p>
                <p>Les présentes CGU régissent l'accès et l'utilisation de la marketplace de seconde main accessible sur le site web et applications mobiles associées.</p>

                <h3>2. Création de compte et rôles</h3>
                <p>L'inscription est ouverte à toute personne physique majeure ou personne morale légalement constituée au Sénégal. L'utilisateur peut être à la fois acheteur et vendeur. Chaque utilisateur est responsable de la confidentialité de ses identifiants.</p>

                <h3>3. Règles de publication des annonces</h3>
                <ul>
                  <li>Tous les articles mis en vente doivent être authentiques, légalement détenus et conformes à la législation sénégalaise.</li>
                  <li>Sont formellement interdits : les contrefaçons, articles volés, produits dangereux, cosmétiques périmés ou ouverts, et tout contenu portant atteinte aux bonnes mœurs.</li>
                  <li>Le vendeur s'engage à décrire fidèlement l'état de l'article et à signaler explicitement tout défaut, tâche ou usure.</li>
                </ul>

                <h3>4. Commandes, Paiement et Protection Séquestre</h3>
                <p>Les paiements sont réalisés via les solutions de Mobile Money partenaires (Wave, Orange Money, Free Money). Lors d'une transaction, les fonds versés par l'acheteur sont sécurisés et bloqués sur un compte de cantonnement (séquestre) jusqu'à ce que l'acheteur accuse réception du colis conforme.</p>
                <p><em>Précision importante : En phase pilote, le paiement sécurisé et le séquestre fonctionnent selon un protocole interne de validation contrôlé sous réserve de l'intégration finale du prestataire de paiement agréé.</em></p>

                <h3>5. Frais de validation et Commission</h3>
                <ul>
                  <li><strong>Frais de validation de 1 % :</strong> Appliqués à l'acheteur pour assurer la protection du paiement et le support litiges.</li>
                  <li><strong>Commission plateforme de 20 % :</strong> Déduite du montant brut revenant au vendeur lors d'une transaction réussie.</li>
                </ul>

                <h3>6. Expédition, Livraison et Délais</h3>
                <p>Le vendeur dispose de 48 heures pour confirmer la commande et confier le colis au service de livraison ou organiser la remise en main propre convenue.</p>

                <h3>7. Confirmation de réception et Déblocage</h3>
                <p>À réception du colis, l'acheteur dispose d'un délai de 48 heures pour vérifier la conformité de l'article avec l'annonce. La confirmation débloque irrévocablement les fonds au profit du vendeur.</p>

                <h3>8. Signalements, Litiges et Suspension de compte</h3>
                <p>En cas d'article non conforme ou non reçu, l'acheteur peut ouvrir une contestation. La plateforme agit en tant que tiers de confiance pour arbitrer. Tout comportement frauduleux, tentative de contournement ou récidive d'articles non conformes entraîne la suspension immédiate du compte.</p>

                <h3>9. Droit applicable et juridiction compétente</h3>
                <p>Les présentes CGU sont soumises au droit sénégalais. Tout litige n'ayant pu trouver de règlement amiable sera soumis aux tribunaux compétents de Dakar.</p>
                """,
                FooterColumn.LEGAL,
                1,
                true
        );

        // 3. Politique de Confidentialité
        createPageWithVersion(
                "Politique de Confidentialité",
                "confidentialite",
                """
                <h2>Politique de Confidentialité et Protection des Données Personnelles</h2>
                <p><em>Date de dernière mise à jour : 10 novembre 2026</em></p>

                <h3>1. Engagement de conformité à la Loi Sénégalaise</h3>
                <p>ReVibe FliP s'engage à protéger la vie privée de ses utilisateurs conformément aux dispositions de la <strong>Loi sénégalaise n° 2008-12 du 25 janvier 2008</strong> portant sur la protection des données à caractère personnel et sous le contrôle de la <strong>Commission de Protection des Données Personnelles (CDP)</strong> du Sénégal.</p>

                <h3>2. Données personnelles collectées</h3>
                <p>Dans le cadre de l'utilisation de nos services, nous collectons les données suivantes :</p>
                <ul>
                  <li><strong>Identité et contact :</strong> Nom, prénom, numéro de téléphone, adresse email, quartier et ville de résidence.</li>
                  <li><strong>Informations de livraison :</strong> Adresse postale précise, instructions de livraison au coursier.</li>
                  <li><strong>Données de transaction :</strong> Historique des achats et ventes, montants, statut de séquestre (les données de compte bancaire ou codes secrets ne transitent jamais sur nos serveurs).</li>
                  <li><strong>Communications :</strong> Messages échangés via la messagerie interne sécurisée de la plateforme.</li>
                </ul>

                <h3>3. Finalités des traitements</h3>
                <p>Vos données sont exclusivement traitées pour :</p>
                <ul>
                  <li>La gestion des comptes utilisateurs et l'authentification sécurisée (OTP).</li>
                  <li>Le traitement des commandes, du paiement sous séquestre et de la livraison.</li>
                  <li>La prévention de la fraude et la résolution des litiges.</li>
                  <li>L'amélioration continue de l'expérience utilisateur.</li>
                </ul>

                <h3>4. Durée de conservation</h3>
                <p>Les données de compte sont conservées pendant toute la durée de vie du compte actif, augmentée de la durée légale de conservation des pièces justificatives commerciales (5 ans selon le droit OHADA applicable au Sénégal).</p>

                <h3>5. Partage avec des tiers de confiance</h3>
                <p>Vos données ne sont jamais revendues à des tiers. Elles sont partagées uniquement avec nos prestataires techniques nécessaires à l'exécution du service :</p>
                <ul>
                  <li>Opérateurs de paiement mobile (Wave, Orange Money, Free Money).</li>
                  <li>Services de livraison et coursiers agréés pour l'acheminement de vos colis.</li>
                </ul>

                <h3>6. Vos droits et contact DPO</h3>
                <p>Conformément à la loi n° 2008-12, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition concernant vos données personnelles.</p>
                <p>Pour exercer vos droits, contactez notre Délégué à la Protection des Données à l'adresse suivante : <strong>[À COMPLÉTER PAR LE PROPRIÉTAIRE : contact@revibeflip.com]</strong> ou adressez une réclamation auprès de la CDP (Commission de Protection des Données Personnelles du Sénégal).</p>
                """,
                FooterColumn.LEGAL,
                2,
                true
        );

        // 4. Mentions Légales
        createPageWithVersion(
                "Mentions Légales",
                "mentions-legales",
                """
                <h2>Mentions Légales</h2>
                <p><em>Date de dernière mise à jour : 10 novembre 2026</em></p>

                <h3>1. Éditeur de la plateforme</h3>
                <p>Le site internet et les services <strong>ReVibe FliP</strong> sont édités par :</p>
                <ul>
                  <li><strong>Raison sociale :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : ex. REVIBE FLIP SAS]</li>
                  <li><strong>Forme juridique :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : ex. Société par Actions Simplifiée au capital de ...]</li>
                  <li><strong>Siège social :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : ex. Rue Carnot, Dakar Plateau, Sénégal]</li>
                  <li><strong>Numéro d'immatriculation RCCM :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : SN.DKR.2026.B.XXXXX]</li>
                  <li><strong>NINEA :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : XXXXXXXXX]</li>
                  <li><strong>Directeur de la publication :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : Nom et prénom du représentant légal]</li>
                  <li><strong>Contact Support :</strong> contact@revibeflip.com / +221 77 123 45 67</li>
                </ul>

                <h3>2. Hébergeur de la plateforme</h3>
                <ul>
                  <li><strong>Prestataire d'hébergement :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : ex. Cloud Hosting Services]</li>
                  <li><strong>Adresse :</strong> [À COMPLÉTER PAR LE PROPRIÉTAIRE : Adresse de l'hébergeur]</li>
                </ul>

                <h3>3. Propriété intellectuelle</h3>
                <p>Tous les éléments constituant la plateforme (logo, marque ReVibe FliP, charte graphique, textes et code source) sont protégés par les lois internationales relatives à la propriété intellectuelle et par l'Organisation Africaine de la Propriété Intellectuelle (OAPI). Toute reproduction non autorisée est passible de poursuites.</p>

                <h3>4. Responsabilité & Statut d'Hébergeur</h3>
                <p>ReVibe FliP agit en tant qu'hébergeur de contenus pour les annonces publiées par ses utilisateurs. À ce titre, la plateforme ne peut être tenue responsable du contenu des annonces sauf si, ayant été alertée de leur caractère illicite, elle n'a pas promptement agi pour les retirer.</p>
                """,
                FooterColumn.LEGAL,
                3,
                true
        );

        log.info("4 pages CMS par défaut créées et publiées avec version initiale.");
    }

    private void seedDefaultFaq() {
        if (faqItemRepository.count() > 0) return;

        List<FaqItem> items = List.of(
                FaqItem.builder()
                        .category("Commandes")
                        .question("Comment se déroule un achat sur ReVibe FliP ?")
                        .answer("Sur ReVibe FliP, vous échangez d'abord avec le vendeur via la messagerie intégrée pour valider l'état et le prix. Le vendeur vous adresse ensuite une offre officielle dans le chat, que vous réglez par Mobile Money sous séquestre.")
                        .sortOrder(1)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Commandes")
                        .question("Puis-je commander plusieurs articles dans un même panier ?")
                        .answer("Oui, à la condition stricte que tous les articles proviennent du même vendeur (panier mono-vendeur). Si vous tentez d'ajouter un article d'une autre boutique, le système vous proposera soit de remplacer votre sélection, soit de conserver votre panier actuel.")
                        .sortOrder(2)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Commandes")
                        .question("Les articles sont-ils uniques ?")
                        .answer("Oui ! Chaque article de seconde main est un exemplaire unique (quantité = 1). Dès qu'une commande est payée, l'article est immédiatement réservé et retiré des paniers des autres utilisateurs.")
                        .sortOrder(3)
                        .isPublished(true)
                        .build(),

                FaqItem.builder()
                        .category("Paiement & Séquestre")
                        .question("Quels sont les moyens de paiement acceptés ?")
                        .answer("Nous acceptons les principaux portefeuilles de Mobile Money au Sénégal : Wave, Orange Money et Free Money. Aucun frais caché : vous ne payez que le prix convenu, les frais de livraison et les 1 % de protection acheteur.")
                        .sortOrder(4)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Paiement & Séquestre")
                        .question("Comment fonctionne la protection par séquestre financier ?")
                        .answer("Lorsque vous réglez votre commande, votre argent n'est pas versé immédiatement au vendeur. Il est bloqué sous séquestre par la plateforme. Les fonds ne sont libérés qu'après réception de votre colis et votre confirmation que l'article est bien conforme à l'annonce.")
                        .sortOrder(5)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Paiement & Séquestre")
                        .question("Quelle est la commission prélevée sur les ventes ?")
                        .answer("La commission plateforme est de 20 % prélevée uniquement sur les ventes réussies auprès des vendeurs. L'acheteur bénéficie de la protection séquestre pour des frais de validation fixes de 1 %.")
                        .sortOrder(6)
                        .isPublished(true)
                        .build(),

                FaqItem.builder()
                        .category("Livraison")
                        .question("Quels sont les modes de livraison disponibles ?")
                        .answer("Deux options s'offrent à vous : la livraison express à domicile par moto sur Dakar et sa banlieue (tarif forfaitaire de 2 000 FCFA), ou la remise en main propre gratuite convenue d'un commun accord avec le vendeur.")
                        .sortOrder(7)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Livraison")
                        .question("Comment puis-je suivre l'acheminement de mon colis ?")
                        .answer("Dès la commande validée, un numéro de suivi unique (ex: TRK-DKR-XXXXX) est généré. Vous pouvez consulter en temps réel l'avancement (Prise en charge > En acheminement > En livraison > Livré) depuis l'onglet 'Mes Commandes'.")
                        .sortOrder(8)
                        .isPublished(true)
                        .build(),

                FaqItem.builder()
                        .category("Litiges & Sécurité")
                        .question("Que faire si l'article reçu ne correspond pas à l'annonce ou comporte des défauts non signalés ?")
                        .answer("Ne confirmez pas la réception sur votre commande ! Vous disposez de 48 heures pour signaler une non-conformité via le bouton d'assistance. Notre équipe bloque les fonds sous séquestre et instruit le dossier pour procéder à un retour ou un remboursement intégral.")
                        .sortOrder(9)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Litiges & Sécurité")
                        .question("Est-il sécurisé de payer le vendeur en dehors de la plateforme ?")
                        .answer("NON ! Pour votre sécurité absolue, ne payez jamais un vendeur en dehors de ReVibe FliP (en espèces directes ou transfert direct). Les transactions hors plateforme perdent la garantie du séquestre et ne peuvent pas être couvertes par notre service client.")
                        .sortOrder(10)
                        .isPublished(true)
                        .build(),

                FaqItem.builder()
                        .category("Compte & Règles")
                        .question("Quelles sont les raisons pouvant entraîner la suspension d'un compte ?")
                        .answer("Un compte peut être suspendu en cas de vente avérée de contrefaçons, de propos injurieux dans la messagerie, de tentative d'escroquerie ou de récidives d'articles non conformes signalés par la communauté.")
                        .sortOrder(11)
                        .isPublished(true)
                        .build(),
                FaqItem.builder()
                        .category("Compte & Règles")
                        .question("Comment contacter le service client ReVibe FliP ?")
                        .answer("Notre équipe de support basée à Dakar est joignable via le formulaire de la page 'Contact', par email à contact@revibeflip.com ou directement par WhatsApp du lundi au samedi de 08h00 à 20h00.")
                        .sortOrder(12)
                        .isPublished(true)
                        .build()
        );

        faqItemRepository.saveAll(items);
        log.info("12 questions FAQ par défaut créées.");
    }

    private void createPageWithVersion(String title, String slug, String content, FooterColumn column, int order, boolean isSystem) {
        CmsPage page = CmsPage.builder()
                .title(title)
                .slug(slug)
                .content(content)
                .status(PageStatus.PUBLISHED)
                .showInFooter(true)
                .footerColumn(column)
                .sortOrder(order)
                .isSystemPage(isSystem)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        CmsPage saved = cmsPageRepository.save(page);

        PageVersion v = PageVersion.builder()
                .page(saved)
                .versionNumber(1)
                .title(title)
                .content(content)
                .status(PageStatus.PUBLISHED)
                .changeSummary("Version initiale préconfigurée")
                .createdAt(LocalDateTime.now())
                .build();
        pageVersionRepository.save(v);
    }
}
