
      const responsibleId = "1";
      const responsibleName = "Test Responsible";
      const kpiSubjectHierarchy = [{"id":"N001","name":"Company Success","parent_id":"","parent_name":"","level":0,"full_path":"Company Success","description":"","comment":"","why_important":"","sort_order":20,"children":[{"id":"N002","name":"Cash generation","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > Cash generation","description":"Capacité de l'entreprise à générer du cash à partir de ses opérations et de sa structure financière.","comment":"Cash generation est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"Sans cash, l'entreprise ne peut pas financer les opérations, investir, rembourser la dette ou rémunérer les actionnaires.","sort_order":21,"children":[{"id":"N003","name":"EBITDA","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > EBITDA","description":"Profit opérationnel avant amortissements, intérêts et impôts.","comment":"EBITDA est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"C'est un indicateur central de performance industrielle et de génération de cash opérationnel.","sort_order":31,"children":[{"id":"N004","name":"Sales","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Sales","description":"Chiffre d'affaires généré par les ventes internes, externes et éléments spécifiques.","comment":"Sales est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Les ventes sont la première source de marge et de financement de l'entreprise.","sort_order":41,"children":[{"id":"N005","name":"Internal Sales","parent_id":"N004","parent_name":"Sales","level":4,"full_path":"Company Success > Cash generation > EBITDA > Sales > Internal Sales","description":"Ventes réalisées entre entités du groupe.","comment":"Internal Sales est un enfant direct de Sales. La relation sert à décomposer Sales en leviers pilotables.","why_important":"Elles influencent le chargement des sites, les marges internes et la cohérence de consolidation.","sort_order":51,"children":[]},{"id":"N006","name":"External Sales","parent_id":"N004","parent_name":"Sales","level":4,"full_path":"Company Success > Cash generation > EBITDA > Sales > External Sales","description":"Ventes réalisées avec des clients externes.","comment":"External Sales est un enfant direct de Sales. La relation sert à décomposer Sales en leviers pilotables.","why_important":"Elles valident la position marché et créent le revenu réel du groupe.","sort_order":61,"children":[]},{"id":"N007","name":"Debit / Credit notes","parent_id":"N004","parent_name":"Sales","level":4,"full_path":"Company Success > Cash generation > EBITDA > Sales > Debit / Credit notes","description":"Avoirs, débits et ajustements apportés aux factures.","comment":"Debit / Credit notes est un enfant direct de Sales. La relation sert à décomposer Sales en leviers pilotables.","why_important":"Ils peuvent révéler des litiges, erreurs de prix, problèmes qualité ou pertes de marge.","sort_order":71,"children":[]},{"id":"N008","name":"Non recurring Sales","parent_id":"N004","parent_name":"Sales","level":4,"full_path":"Company Success > Cash generation > EBITDA > Sales > Non recurring Sales","description":"Ventes exceptionnelles ou ponctuelles.","comment":"Non recurring Sales est un enfant direct de Sales. La relation sert à décomposer Sales en leviers pilotables.","why_important":"Elles améliorent le résultat à court terme mais ne doivent pas masquer la performance récurrente.","sort_order":81,"children":[]},{"id":"N009","name":"Subsidies","parent_id":"N004","parent_name":"Sales","level":4,"full_path":"Company Success > Cash generation > EBITDA > Sales > Subsidies","description":"Subventions ou aides publiques reçues.","comment":"Subsidies est un enfant direct de Sales. La relation sert à décomposer Sales en leviers pilotables.","why_important":"Elles soutiennent la rentabilité et les projets, mais sont souvent conditionnelles ou temporaires.","sort_order":91,"children":[]}]},{"id":"N010","name":"Material Cost","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Material Cost","description":"Coûts matière nécessaires à la fabrication.","comment":"Material Cost est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"C'est généralement l'un des principaux postes de coût et donc un levier majeur de marge.","sort_order":101,"children":[{"id":"N011","name":"Standard cost of manufacturing","parent_id":"N010","parent_name":"Material Cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Material Cost > Standard cost of manufacturing","description":"Coût matière standard utilisé dans les calculs de prix et de marge.","comment":"Standard cost of manufacturing est un enfant direct de Material Cost. La relation sert à décomposer Material Cost en leviers pilotables.","why_important":"Il sert de référence pour mesurer la performance réelle et les écarts.","sort_order":111,"children":[]},{"id":"N012","name":"Scrap","parent_id":"N010","parent_name":"Material Cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Material Cost > Scrap","description":"Matière perdue à cause de rebuts ou défauts.","comment":"Scrap est un enfant direct de Material Cost. La relation sert à décomposer Material Cost en leviers pilotables.","why_important":"Le scrap consomme directement la marge et révèle des faiblesses de process.","sort_order":121,"children":[]},{"id":"N013","name":"Obsolescence","parent_id":"N010","parent_name":"Material Cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Material Cost > Obsolescence","description":"Stocks devenus inutilisables, périmés ou non vendables.","comment":"Obsolescence est un enfant direct de Material Cost. La relation sert à décomposer Material Cost en leviers pilotables.","why_important":"Elle détruit du cash et signale souvent une mauvaise planification ou des changements mal maîtrisés.","sort_order":131,"children":[]},{"id":"N014","name":"Cost of sales","parent_id":"N010","parent_name":"Material Cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Material Cost > Cost of sales","description":"Coûts directement liés aux produits vendus.","comment":"Cost of sales est un enfant direct de Material Cost. La relation sert à décomposer Material Cost en leviers pilotables.","why_important":"Il permet de comprendre la marge brute générée par les ventes.","sort_order":141,"children":[]},{"id":"N015","name":"Price variance","parent_id":"N010","parent_name":"Material Cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Material Cost > Price variance","description":"Écart entre prix d'achat prévu et prix réel.","comment":"Price variance est un enfant direct de Material Cost. La relation sert à décomposer Material Cost en leviers pilotables.","why_important":"Il mesure l'impact de l'inflation, des achats et des négociations fournisseurs.","sort_order":151,"children":[]}]},{"id":"N016","name":"Direct Labor","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Direct Labor","description":"Main-d'œuvre directement impliquée dans la production.","comment":"Direct Labor est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Elle influence la productivité, le coût de conversion et la flexibilité industrielle.","sort_order":161,"children":[{"id":"N017","name":"Standard labor","parent_id":"N016","parent_name":"Direct Labor","level":4,"full_path":"Company Success > Cash generation > EBITDA > Direct Labor > Standard labor","description":"Temps ou coût de main-d'œuvre prévu dans le standard.","comment":"Standard labor est un enfant direct de Direct Labor. La relation sert à décomposer Direct Labor en leviers pilotables.","why_important":"Il sert de base de comparaison pour mesurer les écarts de productivité.","sort_order":171,"children":[]},{"id":"N018","name":"Overtime","parent_id":"N016","parent_name":"Direct Labor","level":4,"full_path":"Company Success > Cash generation > EBITDA > Direct Labor > Overtime","description":"Heures supplémentaires utilisées pour produire ou livrer.","comment":"Overtime est un enfant direct de Direct Labor. La relation sert à décomposer Direct Labor en leviers pilotables.","why_important":"Utile en dépannage, mais coûteux et risqué si cela devient structurel.","sort_order":181,"children":[]},{"id":"N019","name":"Temps","parent_id":"N016","parent_name":"Direct Labor","level":4,"full_path":"Company Success > Cash generation > EBITDA > Direct Labor > Temps","description":"Personnel temporaire ou intérimaire.","comment":"Temps est un enfant direct de Direct Labor. La relation sert à décomposer Direct Labor en leviers pilotables.","why_important":"Apporte de la flexibilité mais peut augmenter le coût, la formation et le risque qualité.","sort_order":191,"children":[]}]},{"id":"N020","name":"Variable overhead","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead","description":"Frais variables indirects liés au niveau d'activité.","comment":"Variable overhead est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Ils influencent le coût de conversion et la compétitivité opérationnelle.","sort_order":201,"children":[{"id":"N021","name":"Tooling","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Tooling","description":"Coûts d'outillages et consommables de production.","comment":"Tooling est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Ils conditionnent la stabilité process, la qualité et le coût industriel.","sort_order":211,"children":[]},{"id":"N022","name":"Spare parts","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Spare parts","description":"Pièces de rechange utilisées en maintenance.","comment":"Spare parts est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Elles évitent les arrêts de production mais doivent rester sous contrôle.","sort_order":221,"children":[]},{"id":"N023","name":"Sorting","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Sorting","description":"Tri ou contrôle renforcé des pièces.","comment":"Sorting est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Protège le client, mais signale souvent un problème qualité à traiter à la racine.","sort_order":231,"children":[{"id":"N024","name":"Internal","parent_id":"N023","parent_name":"Sorting","level":5,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Sorting > Internal","description":"Activité réalisée par les équipes internes.","comment":"Internal est un enfant direct de Sorting. La relation sert à décomposer Sorting en leviers pilotables.","why_important":"Elle donne du contrôle mais mobilise des ressources de l'entreprise.","sort_order":241,"children":[]},{"id":"N025","name":"External","parent_id":"N023","parent_name":"Sorting","level":5,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Sorting > External","description":"Activité réalisée par un prestataire externe.","comment":"External est un enfant direct de Sorting. La relation sert à décomposer Sorting en leviers pilotables.","why_important":"Elle apporte de la capacité mais augmente souvent le coût et la dépendance.","sort_order":251,"children":[]}]},{"id":"N026","name":"Supervisors","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Supervisors","description":"Encadrement direct des équipes de production.","comment":"Supervisors est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Assure discipline, sécurité, productivité et respect des standards.","sort_order":261,"children":[]},{"id":"N027","name":"Quality inspection","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Quality inspection","description":"Contrôle qualité réalisé sur produits ou process.","comment":"Quality inspection est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Réduit le risque client, mais l'objectif reste de rendre le process robuste.","sort_order":271,"children":[]},{"id":"N028","name":"Maintenance staff","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Maintenance staff","description":"Personnel en charge de maintenir les équipements.","comment":"Maintenance staff est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Essentiel pour disponibilité machine, sécurité et performance industrielle.","sort_order":281,"children":[]},{"id":"N029","name":"Tooling staff","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Tooling staff","description":"Personnel dédié aux outils et changements d'outils.","comment":"Tooling staff est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Important pour la stabilité, les temps de changement et la durée de vie des outils.","sort_order":291,"children":[]},{"id":"N030","name":"Energy cost","parent_id":"N020","parent_name":"Variable overhead","level":4,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Energy cost","description":"Coûts des énergies consommées par les opérations.","comment":"Energy cost est un enfant direct de Variable overhead. La relation sert à décomposer Variable overhead en leviers pilotables.","why_important":"Poste sensible aux volumes, prix énergie et efficacité des équipements.","sort_order":301,"children":[{"id":"N031","name":"Electricity","parent_id":"N030","parent_name":"Energy cost","level":5,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Energy cost > Electricity","description":"Consommation électrique.","comment":"Electricity est un enfant direct de Energy cost. La relation sert à décomposer Energy cost en leviers pilotables.","why_important":"Impacte directement le coût industriel et l'empreinte environnementale.","sort_order":311,"children":[]},{"id":"N032","name":"Gas","parent_id":"N030","parent_name":"Energy cost","level":5,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Energy cost > Gas","description":"Consommation de gaz.","comment":"Gas est un enfant direct de Energy cost. La relation sert à décomposer Energy cost en leviers pilotables.","why_important":"Peut être critique pour certains procédés et expose à la volatilité des prix.","sort_order":321,"children":[]},{"id":"N033","name":"Oil","parent_id":"N030","parent_name":"Energy cost","level":5,"full_path":"Company Success > Cash generation > EBITDA > Variable overhead > Energy cost > Oil","description":"Consommation d'huile ou carburant.","comment":"Oil est un enfant direct de Energy cost. La relation sert à décomposer Energy cost en leviers pilotables.","why_important":"Affecte le coût, la maintenance et l'impact environnemental.","sort_order":331,"children":[]}]}]},{"id":"N034","name":"Transportation","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Transportation","description":"Coûts de transport entrants, sortants ou exceptionnels.","comment":"Transportation est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Ils affectent la marge et la qualité de service client.","sort_order":341,"children":[{"id":"N035","name":"Regular freight","parent_id":"N034","parent_name":"Transportation","level":4,"full_path":"Company Success > Cash generation > EBITDA > Transportation > Regular freight","description":"Transport planifié et normal.","comment":"Regular freight est un enfant direct de Transportation. La relation sert à décomposer Transportation en leviers pilotables.","why_important":"Nécessaire pour servir les clients tout en maîtrisant les coûts.","sort_order":351,"children":[]},{"id":"N036","name":"Premium Freight","parent_id":"N034","parent_name":"Transportation","level":4,"full_path":"Company Success > Cash generation > EBITDA > Transportation > Premium Freight","description":"Transport urgent ou exceptionnel.","comment":"Premium Freight est un enfant direct de Transportation. La relation sert à décomposer Transportation en leviers pilotables.","why_important":"Indicateur fort de dysfonctionnement planning, qualité, capacité ou fournisseurs.","sort_order":361,"children":[]},{"id":"N037","name":"Others","parent_id":"N034","parent_name":"Transportation","level":4,"full_path":"Company Success > Cash generation > EBITDA > Transportation > Others","description":"Autres éléments non classés dans les catégories principales.","comment":"Others est un enfant direct de Transportation. La relation sert à décomposer Transportation en leviers pilotables.","why_important":"Permet d'éviter les coûts cachés et d'améliorer la transparence.","sort_order":371,"children":[]}]},{"id":"N038","name":"Fixed and admin cost","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost","description":"Coûts fixes et administratifs de l'organisation.","comment":"Fixed and admin cost est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Ils doivent soutenir l'activité sans absorber excessivement la marge.","sort_order":381,"children":[{"id":"N039","name":"Engineering","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Engineering","description":"Ressources d'ingénierie et support technique.","comment":"Engineering est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Créent la capacité de développement, d'industrialisation et d'amélioration.","sort_order":391,"children":[]},{"id":"N040","name":"Quality","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Quality","description":"Fonction qualité et système qualité.","comment":"Quality est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Protège les clients, les certifications et la robustesse opérationnelle.","sort_order":401,"children":[]},{"id":"N041","name":"Production","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Production","description":"Support et structure de production.","comment":"Production est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Permet d'exécuter les standards et de piloter la performance terrain.","sort_order":411,"children":[]},{"id":"N042","name":"Supply chain","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Supply chain","description":"Planification, approvisionnement et logistique.","comment":"Supply chain est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Pilote le service client, les stocks et la continuité de production.","sort_order":421,"children":[]},{"id":"N043","name":"Finance","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Finance","description":"Contrôle, comptabilité, trésorerie et reporting.","comment":"Finance est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Garantit la fiabilité des chiffres et la discipline cash.","sort_order":431,"children":[]},{"id":"N044","name":"HR","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > HR","description":"Ressources humaines.","comment":"HR est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Soutient recrutement, développement, engagement et conformité sociale.","sort_order":441,"children":[]},{"id":"N045","name":"Management","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Management","description":"Structure de management.","comment":"Management est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Donne la direction, l'arbitrage et l'accountability.","sort_order":451,"children":[]},{"id":"N046","name":"Software","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Software","description":"Logiciels et licences.","comment":"Software est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Augmentent l'efficacité mais créent des coûts récurrents à maîtriser.","sort_order":461,"children":[]},{"id":"N047","name":"Insurance","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Insurance","description":"Assurances de l'entreprise.","comment":"Insurance est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Protège contre les risques opérationnels, juridiques et financiers.","sort_order":471,"children":[]},{"id":"N048","name":"Others","parent_id":"N038","parent_name":"Fixed and admin cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Fixed and admin cost > Others","description":"Autres éléments non classés dans les catégories principales.","comment":"Others est un enfant direct de Fixed and admin cost. La relation sert à décomposer Fixed and admin cost en leviers pilotables.","why_important":"Permet d'éviter les coûts cachés et d'améliorer la transparence.","sort_order":481,"children":[]}]},{"id":"N049","name":"Management cost","parent_id":"N003","parent_name":"EBITDA","level":3,"full_path":"Company Success > Cash generation > EBITDA > Management cost","description":"Coûts des fonctions de management groupe ou business.","comment":"Management cost est un enfant direct de EBITDA. La relation sert à décomposer EBITDA en leviers pilotables.","why_important":"Ils doivent créer de la valeur par le pilotage, la coordination et les décisions.","sort_order":491,"children":[{"id":"N050","name":"Sales","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Sales","description":"Chiffre d'affaires généré par les ventes internes, externes et éléments spécifiques.","comment":"Sales est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Les ventes sont la première source de marge et de financement de l'entreprise.","sort_order":501,"children":[]},{"id":"N051","name":"Purchasing","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Purchasing","description":"Fonction achats.","comment":"Purchasing est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Critique pour coût matière, risques fournisseurs et compétitivité.","sort_order":511,"children":[]},{"id":"N052","name":"Finance","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Finance","description":"Contrôle, comptabilité, trésorerie et reporting.","comment":"Finance est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Garantit la fiabilité des chiffres et la discipline cash.","sort_order":521,"children":[]},{"id":"N053","name":"Operations","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Operations","description":"Pilotage des opérations industrielles.","comment":"Operations est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Aligne qualité, coût, délai et performance des usines.","sort_order":531,"children":[]},{"id":"N054","name":"Product lines","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Product lines","description":"Management des lignes de produits.","comment":"Product lines est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Relie stratégie produit, clients, marge et technologie.","sort_order":541,"children":[]},{"id":"N055","name":"IT","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > IT","description":"Systèmes d'information et technologies.","comment":"IT est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Soutient données, process, cybersécurité et continuité opérationnelle.","sort_order":551,"children":[]},{"id":"N056","name":"Software + insurance","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Software + insurance","description":"Coûts combinés logiciels et assurances.","comment":"Software + insurance est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Poste récurrent à suivre pour éviter l'inflation structurelle.","sort_order":561,"children":[]},{"id":"N057","name":"Others","parent_id":"N049","parent_name":"Management cost","level":4,"full_path":"Company Success > Cash generation > EBITDA > Management cost > Others","description":"Autres éléments non classés dans les catégories principales.","comment":"Others est un enfant direct de Management cost. La relation sert à décomposer Management cost en leviers pilotables.","why_important":"Permet d'éviter les coûts cachés et d'améliorer la transparence.","sort_order":571,"children":[]}]}]},{"id":"N058","name":"Trade working capital","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > Trade working capital","description":"Cash immobilisé dans stocks, créances et dettes fournisseurs.","comment":"Trade working capital est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"C'est un levier direct de trésorerie sans changer le niveau de ventes.","sort_order":581,"children":[{"id":"N059","name":"Inventory","parent_id":"N058","parent_name":"Trade working capital","level":3,"full_path":"Company Success > Cash generation > Trade working capital > Inventory","description":"Stocks de matières, encours et produits finis.","comment":"Inventory est un enfant direct de Trade working capital. La relation sert à décomposer Trade working capital en leviers pilotables.","why_important":"Trop de stock consomme du cash; trop peu de stock menace la livraison.","sort_order":591,"children":[{"id":"N060","name":"Raw material","parent_id":"N059","parent_name":"Inventory","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Raw material","description":"Matières premières nécessaires à la production.","comment":"Raw material est un enfant direct de Inventory. La relation sert à décomposer Inventory en leviers pilotables.","why_important":"Sécurise la production mais immobilise du cash.","sort_order":601,"children":[{"id":"N061","name":"In house","parent_id":"N060","parent_name":"Raw material","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Raw material > In house","description":"Stock ou activité physiquement dans l'entreprise.","comment":"In house est un enfant direct de Raw material. La relation sert à décomposer Raw material en leviers pilotables.","why_important":"Donne de la disponibilité mais augmente la responsabilité et le cash immobilisé.","sort_order":611,"children":[]},{"id":"N062","name":"In transit","parent_id":"N060","parent_name":"Raw material","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Raw material > In transit","description":"Stock en cours de transport.","comment":"In transit est un enfant direct de Raw material. La relation sert à décomposer Raw material en leviers pilotables.","why_important":"Doit être pris en compte pour comprendre disponibilité réelle et cash engagé.","sort_order":621,"children":[]}]},{"id":"N063","name":"WIP","parent_id":"N059","parent_name":"Inventory","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > WIP","description":"Encours de production.","comment":"WIP est un enfant direct de Inventory. La relation sert à décomposer Inventory en leviers pilotables.","why_important":"Révèle la fluidité du flux et les goulets d'étranglement.","sort_order":631,"children":[]},{"id":"N064","name":"Finished product","parent_id":"N059","parent_name":"Inventory","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Finished product","description":"Produits finis prêts à être livrés.","comment":"Finished product est un enfant direct de Inventory. La relation sert à décomposer Inventory en leviers pilotables.","why_important":"Sécurise le service client mais expose à l'obsolescence et au cash immobilisé.","sort_order":641,"children":[{"id":"N065","name":"In house","parent_id":"N064","parent_name":"Finished product","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Finished product > In house","description":"Stock ou activité physiquement dans l'entreprise.","comment":"In house est un enfant direct de Finished product. La relation sert à décomposer Finished product en leviers pilotables.","why_important":"Donne de la disponibilité mais augmente la responsabilité et le cash immobilisé.","sort_order":651,"children":[]},{"id":"N066","name":"In transit to customers","parent_id":"N064","parent_name":"Finished product","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Finished product > In transit to customers","description":"Produits finis expédiés mais pas encore reçus ou reconnus selon les conditions.","comment":"In transit to customers est un enfant direct de Finished product. La relation sert à décomposer Finished product en leviers pilotables.","why_important":"Impacte le cash, le risque et le timing de facturation.","sort_order":661,"children":[]},{"id":"N067","name":"On platform","parent_id":"N064","parent_name":"Finished product","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Inventory > Finished product > On platform","description":"Stock situé sur plateforme logistique ou client.","comment":"On platform est un enfant direct de Finished product. La relation sert à décomposer Finished product en leviers pilotables.","why_important":"Améliore le service mais doit être financièrement maîtrisé.","sort_order":671,"children":[]}]}]},{"id":"N068","name":"Trade receivables","parent_id":"N058","parent_name":"Trade working capital","level":3,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables","description":"Créances clients internes ou externes.","comment":"Trade receivables est un enfant direct de Trade working capital. La relation sert à décomposer Trade working capital en leviers pilotables.","why_important":"Le délai de paiement client influence directement la trésorerie.","sort_order":681,"children":[{"id":"N069","name":"Internal","parent_id":"N068","parent_name":"Trade receivables","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > Internal","description":"Activité réalisée par les équipes internes.","comment":"Internal est un enfant direct de Trade receivables. La relation sert à décomposer Trade receivables en leviers pilotables.","why_important":"Elle donne du contrôle mais mobilise des ressources de l'entreprise.","sort_order":691,"children":[{"id":"N070","name":"Regular","parent_id":"N069","parent_name":"Internal","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > Internal > Regular","description":"Situation normale dans les délais prévus.","comment":"Regular est un enfant direct de Internal. La relation sert à décomposer Internal en leviers pilotables.","why_important":"Permet une gestion saine et prévisible du cash.","sort_order":701,"children":[]},{"id":"N071","name":"Late","parent_id":"N069","parent_name":"Internal","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > Internal > Late","description":"Situation en retard par rapport aux conditions prévues.","comment":"Late est un enfant direct de Internal. La relation sert à décomposer Internal en leviers pilotables.","why_important":"Crée une tension cash et signale un risque de litige ou de discipline.","sort_order":711,"children":[]}]},{"id":"N072","name":"External","parent_id":"N068","parent_name":"Trade receivables","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > External","description":"Activité réalisée par un prestataire externe.","comment":"External est un enfant direct de Trade receivables. La relation sert à décomposer Trade receivables en leviers pilotables.","why_important":"Elle apporte de la capacité mais augmente souvent le coût et la dépendance.","sort_order":721,"children":[{"id":"N073","name":"Regular","parent_id":"N072","parent_name":"External","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > External > Regular","description":"Situation normale dans les délais prévus.","comment":"Regular est un enfant direct de External. La relation sert à décomposer External en leviers pilotables.","why_important":"Permet une gestion saine et prévisible du cash.","sort_order":731,"children":[]},{"id":"N074","name":"Late","parent_id":"N072","parent_name":"External","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade receivables > External > Late","description":"Situation en retard par rapport aux conditions prévues.","comment":"Late est un enfant direct de External. La relation sert à décomposer External en leviers pilotables.","why_important":"Crée une tension cash et signale un risque de litige ou de discipline.","sort_order":741,"children":[]}]}]},{"id":"N075","name":"Trade payables","parent_id":"N058","parent_name":"Trade working capital","level":3,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables","description":"Dettes fournisseurs internes ou externes.","comment":"Trade payables est un enfant direct de Trade working capital. La relation sert à décomposer Trade working capital en leviers pilotables.","why_important":"Les délais de paiement fournisseurs financent une partie de l'activité.","sort_order":751,"children":[{"id":"N076","name":"Internal","parent_id":"N075","parent_name":"Trade payables","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > Internal","description":"Activité réalisée par les équipes internes.","comment":"Internal est un enfant direct de Trade payables. La relation sert à décomposer Trade payables en leviers pilotables.","why_important":"Elle donne du contrôle mais mobilise des ressources de l'entreprise.","sort_order":761,"children":[{"id":"N077","name":"Regular","parent_id":"N076","parent_name":"Internal","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > Internal > Regular","description":"Situation normale dans les délais prévus.","comment":"Regular est un enfant direct de Internal. La relation sert à décomposer Internal en leviers pilotables.","why_important":"Permet une gestion saine et prévisible du cash.","sort_order":771,"children":[]},{"id":"N078","name":"Late","parent_id":"N076","parent_name":"Internal","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > Internal > Late","description":"Situation en retard par rapport aux conditions prévues.","comment":"Late est un enfant direct de Internal. La relation sert à décomposer Internal en leviers pilotables.","why_important":"Crée une tension cash et signale un risque de litige ou de discipline.","sort_order":781,"children":[]}]},{"id":"N079","name":"External","parent_id":"N075","parent_name":"Trade payables","level":4,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > External","description":"Activité réalisée par un prestataire externe.","comment":"External est un enfant direct de Trade payables. La relation sert à décomposer Trade payables en leviers pilotables.","why_important":"Elle apporte de la capacité mais augmente souvent le coût et la dépendance.","sort_order":791,"children":[{"id":"N080","name":"Regular","parent_id":"N079","parent_name":"External","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > External > Regular","description":"Situation normale dans les délais prévus.","comment":"Regular est un enfant direct de External. La relation sert à décomposer External en leviers pilotables.","why_important":"Permet une gestion saine et prévisible du cash.","sort_order":801,"children":[]},{"id":"N081","name":"Late","parent_id":"N079","parent_name":"External","level":5,"full_path":"Company Success > Cash generation > Trade working capital > Trade payables > External > Late","description":"Situation en retard par rapport aux conditions prévues.","comment":"Late est un enfant direct de External. La relation sert à décomposer External en leviers pilotables.","why_important":"Crée une tension cash et signale un risque de litige ou de discipline.","sort_order":811,"children":[]}]}]}]},{"id":"N082","name":"CAPEX","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > CAPEX","description":"Investissements en machines, outils, bâtiments ou systèmes.","comment":"CAPEX est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"Consomme du cash aujourd'hui pour créer capacité, qualité ou productivité demain.","sort_order":821,"children":[]},{"id":"N083","name":"Company taxes","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > Company taxes","description":"Impôts et taxes à payer.","comment":"Company taxes est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"Obligation de cash à anticiper pour éviter les tensions de trésorerie.","sort_order":831,"children":[]},{"id":"N084","name":"Dividends","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > Dividends","description":"Distribution de cash aux actionnaires.","comment":"Dividends est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"Doit rester compatible avec investissements, dette et résilience de l'entreprise.","sort_order":841,"children":[]},{"id":"N085","name":"External financing (Debt)","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > External financing (Debt)","description":"Sources de financement externes sous forme de dette.","comment":"External financing (Debt) est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"Apporte de la liquidité mais crée intérêts, contraintes et remboursements.","sort_order":851,"children":[{"id":"N086","name":"Loans","parent_id":"N085","parent_name":"External financing (Debt)","level":3,"full_path":"Company Success > Cash generation > External financing (Debt) > Loans","description":"Emprunts bancaires ou financiers.","comment":"Loans est un enfant direct de External financing (Debt). La relation sert à décomposer External financing (Debt) en leviers pilotables.","why_important":"Financent long terme mais augmentent l'endettement.","sort_order":861,"children":[]},{"id":"N087","name":"Factoring","parent_id":"N085","parent_name":"External financing (Debt)","level":3,"full_path":"Company Success > Cash generation > External financing (Debt) > Factoring","description":"Financement ou cession des créances clients.","comment":"Factoring est un enfant direct de External financing (Debt). La relation sert à décomposer External financing (Debt) en leviers pilotables.","why_important":"Accélère le cash mais a un coût et peut signaler une tension de trésorerie.","sort_order":871,"children":[]},{"id":"N088","name":"Overdraft facility","parent_id":"N085","parent_name":"External financing (Debt)","level":3,"full_path":"Company Success > Cash generation > External financing (Debt) > Overdraft facility","description":"Ligne de découvert bancaire court terme.","comment":"Overdraft facility est un enfant direct de External financing (Debt). La relation sert à décomposer External financing (Debt) en leviers pilotables.","why_important":"Utile pour absorber les pics de besoin mais coûteuse si structurelle.","sort_order":881,"children":[]}]},{"id":"N089","name":"Financial costs","parent_id":"N002","parent_name":"Cash generation","level":2,"full_path":"Company Success > Cash generation > Financial costs","description":"Intérêts et frais financiers.","comment":"Financial costs est un enfant direct de Cash generation. La relation sert à décomposer Cash generation en leviers pilotables.","why_important":"Réduisent le résultat net et montrent le coût du financement.","sort_order":891,"children":[]}]},{"id":"N090","name":"Customer satisfaction","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > Customer satisfaction","description":"Capacité à satisfaire les attentes clients en qualité, délai, coût et développement.","comment":"Customer satisfaction est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"Conditionne la fidélité, les nouveaux business et la réputation.","sort_order":901,"children":[{"id":"N091","name":"Capacity to develop","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Capacity to develop","description":"Capacité à développer produits et solutions.","comment":"Capacity to develop est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Alimente les ventes futures et la crédibilité technique.","sort_order":911,"children":[{"id":"N092","name":"Products available","parent_id":"N091","parent_name":"Capacity to develop","level":3,"full_path":"Company Success > Customer satisfaction > Capacity to develop > Products available","description":"Catalogue ou solutions déjà disponibles.","comment":"Products available est un enfant direct de Capacity to develop. La relation sert à décomposer Capacity to develop en leviers pilotables.","why_important":"Réduit les délais de réponse et augmente les opportunités commerciales.","sort_order":921,"children":[]},{"id":"N093","name":"Support available","parent_id":"N091","parent_name":"Capacity to develop","level":3,"full_path":"Company Success > Customer satisfaction > Capacity to develop > Support available","description":"Ressources techniques, projet, qualité et commerciales disponibles.","comment":"Support available est un enfant direct de Capacity to develop. La relation sert à décomposer Capacity to develop en leviers pilotables.","why_important":"Le client doit sentir que l'organisation peut l'accompagner.","sort_order":931,"children":[]}]},{"id":"N094","name":"Industry compliance","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Industry compliance","description":"Respect des standards et certifications de l'industrie.","comment":"Industry compliance est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Indispensable pour rester qualifié chez les clients automobiles et industriels.","sort_order":941,"children":[{"id":"N095","name":"Systems","parent_id":"N094","parent_name":"Industry compliance","level":3,"full_path":"Company Success > Customer satisfaction > Industry compliance > Systems","description":"Systèmes de management et de conformité.","comment":"Systems est un enfant direct de Industry compliance. La relation sert à décomposer Industry compliance en leviers pilotables.","why_important":"Structurent les processus, audits et exigences clients.","sort_order":951,"children":[{"id":"N096","name":"IATF","parent_id":"N095","parent_name":"Systems","level":4,"full_path":"Company Success > Customer satisfaction > Industry compliance > Systems > IATF","description":"Système qualité automobile IATF.","comment":"IATF est un enfant direct de Systems. La relation sert à décomposer Systems en leviers pilotables.","why_important":"Souvent indispensable pour être fournisseur automobile.","sort_order":961,"children":[]},{"id":"N097","name":"VDA 6.3 in production","parent_id":"N095","parent_name":"Systems","level":4,"full_path":"Company Success > Customer satisfaction > Industry compliance > Systems > VDA 6.3 in production","description":"Audit process VDA 6.3 appliqué à la production.","comment":"VDA 6.3 in production est un enfant direct de Systems. La relation sert à décomposer Systems en leviers pilotables.","why_important":"Preuve de maturité process, particulièrement importante pour les clients allemands.","sort_order":971,"children":[]},{"id":"N098","name":"ISO 14001","parent_id":"N095","parent_name":"Systems","level":4,"full_path":"Company Success > Customer satisfaction > Industry compliance > Systems > ISO 14001","description":"Système de management environnemental.","comment":"ISO 14001 est un enfant direct de Systems. La relation sert à décomposer Systems en leviers pilotables.","why_important":"Renforce conformité, durabilité et crédibilité client.","sort_order":981,"children":[]}]}]},{"id":"N099","name":"Customer claims","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Customer claims","description":"Réclamations clients.","comment":"Customer claims est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Mesurent directement la douleur client et les défauts livrés.","sort_order":991,"children":[{"id":"N100","name":"Number of claims","parent_id":"N099","parent_name":"Customer claims","level":3,"full_path":"Company Success > Customer satisfaction > Customer claims > Number of claims","description":"Nombre de réclamations.","comment":"Number of claims est un enfant direct de Customer claims. La relation sert à décomposer Customer claims en leviers pilotables.","why_important":"Mesure simple de la performance qualité client ou fournisseur.","sort_order":1001,"children":[]},{"id":"N101","name":"Responsiveness","parent_id":"N099","parent_name":"Customer claims","level":3,"full_path":"Company Success > Customer satisfaction > Customer claims > Responsiveness","description":"Vitesse et qualité de réponse aux problèmes clients.","comment":"Responsiveness est un enfant direct de Customer claims. La relation sert à décomposer Customer claims en leviers pilotables.","why_important":"Protège la confiance et limite les escalades.","sort_order":1011,"children":[]},{"id":"N102","name":"Level of recurrence","parent_id":"N099","parent_name":"Customer claims","level":3,"full_path":"Company Success > Customer satisfaction > Customer claims > Level of recurrence","description":"Répétition des mêmes problèmes.","comment":"Level of recurrence est un enfant direct de Customer claims. La relation sert à décomposer Customer claims en leviers pilotables.","why_important":"La récurrence montre que les causes racines ne sont pas éliminées.","sort_order":1021,"children":[]}]},{"id":"N103","name":"Delivery","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Delivery","description":"Performance de livraison.","comment":"Delivery est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Un fournisseur fiable livre à l'heure, dans la bonne quantité.","sort_order":1031,"children":[{"id":"N104","name":"On time delivery","parent_id":"N103","parent_name":"Delivery","level":3,"full_path":"Company Success > Customer satisfaction > Delivery > On time delivery","description":"Livraison à la date demandée ou confirmée.","comment":"On time delivery est un enfant direct de Delivery. La relation sert à décomposer Delivery en leviers pilotables.","why_important":"Critère majeur de satisfaction et de maintien des programmes.","sort_order":1041,"children":[]},{"id":"N105","name":"Flexibility","parent_id":"N103","parent_name":"Delivery","level":3,"full_path":"Company Success > Customer satisfaction > Delivery > Flexibility","description":"Capacité à s'adapter aux variations client.","comment":"Flexibility est un enfant direct de Delivery. La relation sert à décomposer Delivery en leviers pilotables.","why_important":"Important dans les environnements volatils ou en ramp-up.","sort_order":1051,"children":[]}]},{"id":"N106","name":"Projects","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Projects","description":"Exécution des projets clients.","comment":"Projects est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Conditionne les lancements, la confiance et les futurs contrats.","sort_order":1061,"children":[{"id":"N107","name":"Project Milestone respect","parent_id":"N106","parent_name":"Projects","level":3,"full_path":"Company Success > Customer satisfaction > Projects > Project Milestone respect","description":"Respect des jalons projet.","comment":"Project Milestone respect est un enfant direct de Projects. La relation sert à décomposer Projects en leviers pilotables.","why_important":"Évite retards, surcoûts et perte de confiance.","sort_order":1071,"children":[]},{"id":"N108","name":"Zero defect on prototypes","parent_id":"N106","parent_name":"Projects","level":3,"full_path":"Company Success > Customer satisfaction > Projects > Zero defect on prototypes","description":"Prototypes sans défaut.","comment":"Zero defect on prototypes est un enfant direct de Projects. La relation sert à décomposer Projects en leviers pilotables.","why_important":"Crée la confiance dès les phases amont.","sort_order":1081,"children":[]},{"id":"N109","name":"Zero problem with PPAP","parent_id":"N106","parent_name":"Projects","level":3,"full_path":"Company Success > Customer satisfaction > Projects > Zero problem with PPAP","description":"Validation PPAP sans problème.","comment":"Zero problem with PPAP est un enfant direct de Projects. La relation sert à décomposer Projects en leviers pilotables.","why_important":"Conditionne l'autorisation de produire en série.","sort_order":1091,"children":[]},{"id":"N110","name":"Flawless SOP","parent_id":"N106","parent_name":"Projects","level":3,"full_path":"Company Success > Customer satisfaction > Projects > Flawless SOP","description":"Démarrage série sans crise.","comment":"Flawless SOP est un enfant direct de Projects. La relation sert à décomposer Projects en leviers pilotables.","why_important":"Évite premium freight, défauts, retards et tensions client.","sort_order":1101,"children":[]}]},{"id":"N111","name":"Competitiveness","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Competitiveness","description":"Capacité à être compétitif en coût, technologie et service.","comment":"Competitiveness est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Protège les volumes et permet de gagner de nouveaux marchés.","sort_order":1111,"children":[{"id":"N112","name":"Capacity to provide technical productivities","parent_id":"N111","parent_name":"Competitiveness","level":3,"full_path":"Company Success > Customer satisfaction > Competitiveness > Capacity to provide technical productivities","description":"Capacité à générer des gains par amélioration technique.","comment":"Capacity to provide technical productivities est un enfant direct de Competitiveness. La relation sert à décomposer Competitiveness en leviers pilotables.","why_important":"Permet de compenser les demandes de productivité client sans détruire la marge.","sort_order":1121,"children":[]},{"id":"N113","name":"Yearly savings","parent_id":"N111","parent_name":"Competitiveness","level":3,"full_path":"Company Success > Customer satisfaction > Competitiveness > Yearly savings","description":"Économies annuelles proposées ou réalisées.","comment":"Yearly savings est un enfant direct de Competitiveness. La relation sert à décomposer Competitiveness en leviers pilotables.","why_important":"Maintient la compétitivité dans la durée.","sort_order":1131,"children":[]}]},{"id":"N114","name":"Global footprint","parent_id":"N090","parent_name":"Customer satisfaction","level":2,"full_path":"Company Success > Customer satisfaction > Global footprint","description":"Présence ou capacité de service mondiale.","comment":"Global footprint est un enfant direct de Customer satisfaction. La relation sert à décomposer Customer satisfaction en leviers pilotables.","why_important":"Permet de servir les clients globaux localement et de réduire les risques.","sort_order":1141,"children":[]}]},{"id":"N115","name":"Partnership","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > Partnership","description":"Qualité des relations stratégiques avec les parties prenantes.","comment":"Partnership est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"Les relations fortes facilitent résolution de crise, nouveaux business et confiance long terme.","sort_order":1151,"children":[{"id":"N116","name":"Good high level relationships","parent_id":"N115","parent_name":"Partnership","level":2,"full_path":"Company Success > Partnership > Good high level relationships","description":"Relations solides au bon niveau de décision.","comment":"Good high level relationships est un enfant direct de Partnership. La relation sert à décomposer Partnership en leviers pilotables.","why_important":"Aide à anticiper, arbitrer et sécuriser les partenariats.","sort_order":1161,"children":[]}]},{"id":"N117","name":"People support","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > People support","description":"Soutien apporté aux équipes et au développement humain.","comment":"People support est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"Les résultats durables dépendent de personnes engagées, compétentes et respectées.","sort_order":1171,"children":[{"id":"N118","name":"People find their place in the organization","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > People find their place in the organization","description":"Chaque personne comprend son rôle et sa contribution.","comment":"People find their place in the organization est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"Améliore engagement, clarté et efficacité collective.","sort_order":1181,"children":[]},{"id":"N119","name":"Development of ownership","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > Development of ownership","description":"Développement du sens de responsabilité.","comment":"Development of ownership est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"L'ownership transforme les plans en exécution réelle.","sort_order":1191,"children":[]},{"id":"N120","name":"Give perspectives","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > Give perspectives","description":"Offrir des perspectives d'évolution.","comment":"Give perspectives est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"Aide à fidéliser et motiver les talents.","sort_order":1201,"children":[]},{"id":"N121","name":"Train and develop","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > Train and develop","description":"Former et développer les compétences.","comment":"Train and develop est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"Améliore qualité, sécurité, autonomie et performance.","sort_order":1211,"children":[]},{"id":"N122","name":"Compensate properly","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > Compensate properly","description":"Rémunérer de façon juste et compétitive.","comment":"Compensate properly est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"Soutient motivation, rétention et paix sociale.","sort_order":1221,"children":[]},{"id":"N123","name":"Respect","parent_id":"N117","parent_name":"People support","level":2,"full_path":"Company Success > People support > Respect","description":"Respect des personnes et du cadre de travail.","comment":"Respect est un enfant direct de People support. La relation sert à décomposer People support en leviers pilotables.","why_important":"Fondement de la confiance et de la culture d'entreprise.","sort_order":1231,"children":[]}]},{"id":"N124","name":"Suppliers support","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > Suppliers support","description":"Capacité des fournisseurs à soutenir les objectifs du groupe.","comment":"Suppliers support est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"La performance fournisseur influence directement qualité, délai, coût et cash.","sort_order":1241,"children":[{"id":"N125","name":"Meeting our customer satisfaction requirements","parent_id":"N124","parent_name":"Suppliers support","level":2,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements","description":"Fournisseurs alignés sur nos engagements clients.","comment":"Meeting our customer satisfaction requirements est un enfant direct de Suppliers support. La relation sert à décomposer Suppliers support en leviers pilotables.","why_important":"Un mauvais fournisseur peut créer un mauvais service client.","sort_order":1251,"children":[{"id":"N126","name":"Number of claims","parent_id":"N125","parent_name":"Meeting our customer satisfaction requirements","level":3,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements > Number of claims","description":"Nombre de réclamations.","comment":"Number of claims est un enfant direct de Meeting our customer satisfaction requirements. La relation sert à décomposer Meeting our customer satisfaction requirements en leviers pilotables.","why_important":"Mesure simple de la performance qualité client ou fournisseur.","sort_order":1261,"children":[]},{"id":"N127","name":"On time delivery","parent_id":"N125","parent_name":"Meeting our customer satisfaction requirements","level":3,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements > On time delivery","description":"Livraison à la date demandée ou confirmée.","comment":"On time delivery est un enfant direct de Meeting our customer satisfaction requirements. La relation sert à décomposer Meeting our customer satisfaction requirements en leviers pilotables.","why_important":"Critère majeur de satisfaction et de maintien des programmes.","sort_order":1271,"children":[]},{"id":"N128","name":"Certification","parent_id":"N125","parent_name":"Meeting our customer satisfaction requirements","level":3,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements > Certification","description":"Certifications fournisseurs.","comment":"Certification est un enfant direct de Meeting our customer satisfaction requirements. La relation sert à décomposer Meeting our customer satisfaction requirements en leviers pilotables.","why_important":"Réduit les risques qualité et prouve la maturité système.","sort_order":1281,"children":[]},{"id":"N129","name":"Productivity","parent_id":"N125","parent_name":"Meeting our customer satisfaction requirements","level":3,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements > Productivity","description":"Capacité fournisseur à améliorer coûts et efficacité.","comment":"Productivity est un enfant direct de Meeting our customer satisfaction requirements. La relation sert à décomposer Meeting our customer satisfaction requirements en leviers pilotables.","why_important":"Soutient les baisses de coût et la marge.","sort_order":1291,"children":[]},{"id":"N130","name":"Technical support","parent_id":"N125","parent_name":"Meeting our customer satisfaction requirements","level":3,"full_path":"Company Success > Suppliers support > Meeting our customer satisfaction requirements > Technical support","description":"Support technique fourni par les fournisseurs.","comment":"Technical support est un enfant direct de Meeting our customer satisfaction requirements. La relation sert à décomposer Meeting our customer satisfaction requirements en leviers pilotables.","why_important":"Aide au développement, à la résolution de problèmes et aux lancements.","sort_order":1301,"children":[]}]},{"id":"N131","name":"Financially attractive","parent_id":"N124","parent_name":"Suppliers support","level":2,"full_path":"Company Success > Suppliers support > Financially attractive","description":"Conditions fournisseurs favorables économiquement et financièrement.","comment":"Financially attractive est un enfant direct de Suppliers support. La relation sert à décomposer Suppliers support en leviers pilotables.","why_important":"Améliore coût total, cash et résilience supply chain.","sort_order":1311,"children":[{"id":"N132","name":"Local","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Local","description":"Proximité géographique du fournisseur.","comment":"Local est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Réduit lead time, transport, risques et stock.","sort_order":1321,"children":[]},{"id":"N133","name":"Platform inventory","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Platform inventory","description":"Stock fournisseur ou plateforme dédié.","comment":"Platform inventory est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Sécurise l'approvisionnement mais doit être optimisé financièrement.","sort_order":1331,"children":[]},{"id":"N134","name":"Terms of payment","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Terms of payment","description":"Conditions de paiement négociées.","comment":"Terms of payment est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Impactent directement le besoin en fonds de roulement.","sort_order":1341,"children":[]},{"id":"N135","name":"Safety stock commitment","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Safety stock commitment","description":"Engagement de stock de sécurité.","comment":"Safety stock commitment est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Protège la continuité de production en cas d'aléas.","sort_order":1351,"children":[]},{"id":"N136","name":"Invoice trigger","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Invoice trigger","description":"Moment déclenchant la facturation fournisseur.","comment":"Invoice trigger est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Influence le cash et la reconnaissance des dettes.","sort_order":1361,"children":[]},{"id":"N137","name":"Delivery frequency","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Delivery frequency","description":"Fréquence des livraisons.","comment":"Delivery frequency est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Équilibre transport, stock et flexibilité.","sort_order":1371,"children":[]},{"id":"N138","name":"Incoterms","parent_id":"N131","parent_name":"Financially attractive","level":3,"full_path":"Company Success > Suppliers support > Financially attractive > Incoterms","description":"Conditions contractuelles de livraison.","comment":"Incoterms est un enfant direct de Financially attractive. La relation sert à décomposer Financially attractive en leviers pilotables.","why_important":"Définissent coûts, risques, responsabilités et transfert de propriété.","sort_order":1381,"children":[]}]}]},{"id":"N139","name":"Development","parent_id":"N001","parent_name":"Company Success","level":1,"full_path":"Company Success > Development","description":"Développement des produits, clients, marchés et options stratégiques.","comment":"Development est un enfant direct de Company Success. La relation sert à décomposer Company Success en leviers pilotables.","why_important":"Crée la croissance future et prépare la position long terme.","sort_order":1391,"children":[{"id":"N140","name":"Product","parent_id":"N139","parent_name":"Development","level":2,"full_path":"Company Success > Development > Product","description":"Développement et gestion de l'offre produit.","comment":"Product est un enfant direct de Development. La relation sert à décomposer Development en leviers pilotables.","why_important":"Assure que l'offre est prête, compétitive et industrialisable.","sort_order":1401,"children":[{"id":"N141","name":"Readiness","parent_id":"N140","parent_name":"Product","level":3,"full_path":"Company Success > Development > Product > Readiness","description":"Niveau de préparation du produit.","comment":"Readiness est un enfant direct de Product. La relation sert à décomposer Product en leviers pilotables.","why_important":"Réduit les risques de lancement et accélère la mise sur le marché.","sort_order":1411,"children":[]},{"id":"N142","name":"Competitiveness","parent_id":"N140","parent_name":"Product","level":3,"full_path":"Company Success > Development > Product > Competitiveness","description":"Capacité à être compétitif en coût, technologie et service.","comment":"Competitiveness est un enfant direct de Product. La relation sert à décomposer Product en leviers pilotables.","why_important":"Protège les volumes et permet de gagner de nouveaux marchés.","sort_order":1421,"children":[]},{"id":"N143","name":"Ease to cost","parent_id":"N140","parent_name":"Product","level":3,"full_path":"Company Success > Development > Product > Ease to cost","description":"Facilité à chiffrer les coûts.","comment":"Ease to cost est un enfant direct de Product. La relation sert à décomposer Product en leviers pilotables.","why_important":"Accélère les devis et renforce la discipline de marge.","sort_order":1431,"children":[]},{"id":"N144","name":"Worldwide offer","parent_id":"N140","parent_name":"Product","level":3,"full_path":"Company Success > Development > Product > Worldwide offer","description":"Offre disponible mondialement.","comment":"Worldwide offer est un enfant direct de Product. La relation sert à décomposer Product en leviers pilotables.","why_important":"Répond aux besoins des clients globaux et favorise les synergies.","sort_order":1441,"children":[]},{"id":"N145","name":"Costing OTD","parent_id":"N140","parent_name":"Product","level":3,"full_path":"Company Success > Development > Product > Costing OTD","description":"Respect des délais de chiffrage.","comment":"Costing OTD est un enfant direct de Product. La relation sert à décomposer Product en leviers pilotables.","why_important":"La réactivité commerciale augmente le taux de succès.","sort_order":1451,"children":[]}]},{"id":"N146","name":"Commercial","parent_id":"N139","parent_name":"Development","level":2,"full_path":"Company Success > Development > Commercial","description":"Développement commercial.","comment":"Commercial est un enfant direct de Development. La relation sert à décomposer Development en leviers pilotables.","why_important":"Transforme les capacités en commandes et revenus.","sort_order":1461,"children":[{"id":"N147","name":"Multi product development at existing customers","parent_id":"N146","parent_name":"Commercial","level":3,"full_path":"Company Success > Development > Commercial > Multi product development at existing customers","description":"Développement de plusieurs produits chez les clients existants.","comment":"Multi product development at existing customers est un enfant direct de Commercial. La relation sert à décomposer Commercial en leviers pilotables.","why_important":"Augmente la part de portefeuille avec un risque commercial moindre.","sort_order":1471,"children":[]},{"id":"N148","name":"New customers","parent_id":"N146","parent_name":"Commercial","level":3,"full_path":"Company Success > Development > Commercial > New customers","description":"Acquisition de nouveaux clients.","comment":"New customers est un enfant direct de Commercial. La relation sert à décomposer Commercial en leviers pilotables.","why_important":"Diversifie le chiffre d'affaires et réduit la dépendance.","sort_order":1481,"children":[]},{"id":"N149","name":"New business segments","parent_id":"N146","parent_name":"Commercial","level":3,"full_path":"Company Success > Development > Commercial > New business segments","description":"Entrée dans de nouveaux segments.","comment":"New business segments est un enfant direct de Commercial. La relation sert à décomposer Commercial en leviers pilotables.","why_important":"Crée de nouveaux relais de croissance.","sort_order":1491,"children":[]}]},{"id":"N150","name":"Strategic","parent_id":"N139","parent_name":"Development","level":2,"full_path":"Company Success > Development > Strategic","description":"Développement stratégique long terme.","comment":"Strategic est un enfant direct de Development. La relation sert à décomposer Development en leviers pilotables.","why_important":"Prépare les choix d'investissement, d'acquisition et de positionnement.","sort_order":1501,"children":[{"id":"N151","name":"Future market positioning","parent_id":"N150","parent_name":"Strategic","level":3,"full_path":"Company Success > Development > Strategic > Future market positioning","description":"Positionnement sur les marchés futurs.","comment":"Future market positioning est un enfant direct de Strategic. La relation sert à décomposer Strategic en leviers pilotables.","why_important":"Protège la pertinence de l'entreprise face aux changements de marché.","sort_order":1511,"children":[]},{"id":"N152","name":"External growth","parent_id":"N150","parent_name":"Strategic","level":3,"full_path":"Company Success > Development > Strategic > External growth","description":"Croissance par acquisition ou partenariat externe.","comment":"External growth est un enfant direct de Strategic. La relation sert à décomposer Strategic en leviers pilotables.","why_important":"Accélère capacités, empreinte ou accès marché.","sort_order":1521,"children":[]},{"id":"N153","name":"Market studies","parent_id":"N150","parent_name":"Strategic","level":3,"full_path":"Company Success > Development > Strategic > Market studies","description":"Études de marché structurées.","comment":"Market studies est un enfant direct de Strategic. La relation sert à décomposer Strategic en leviers pilotables.","why_important":"Réduisent l'incertitude et améliorent les décisions stratégiques.","sort_order":1531,"children":[{"id":"N154","name":"Existing customers","parent_id":"N153","parent_name":"Market studies","level":4,"full_path":"Company Success > Development > Strategic > Market studies > Existing customers","description":"Analyse des opportunités chez clients actuels.","comment":"Existing customers est un enfant direct de Market studies. La relation sert à décomposer Market studies en leviers pilotables.","why_important":"Permet de croître avec une base de confiance existante.","sort_order":1541,"children":[]},{"id":"N155","name":"New customers","parent_id":"N153","parent_name":"Market studies","level":4,"full_path":"Company Success > Development > Strategic > Market studies > New customers","description":"Acquisition de nouveaux clients.","comment":"New customers est un enfant direct de Market studies. La relation sert à décomposer Market studies en leviers pilotables.","why_important":"Diversifie le chiffre d'affaires et réduit la dépendance.","sort_order":1551,"children":[]},{"id":"N156","name":"New opportunities","parent_id":"N153","parent_name":"Market studies","level":4,"full_path":"Company Success > Development > Strategic > Market studies > New opportunities","description":"Nouvelles applications, produits ou marchés.","comment":"New opportunities est un enfant direct de Market studies. La relation sert à décomposer Market studies en leviers pilotables.","why_important":"Alimente l'innovation et le pipeline futur.","sort_order":1561,"children":[]},{"id":"N157","name":"Long term trends","parent_id":"N153","parent_name":"Market studies","level":4,"full_path":"Company Success > Development > Strategic > Market studies > Long term trends","description":"Tendances structurelles long terme.","comment":"Long term trends est un enfant direct de Market studies. La relation sert à décomposer Market studies en leviers pilotables.","why_important":"Aide à anticiper les ruptures et orienter les investissements.","sort_order":1571,"children":[]}]}]}]}]}];
      let currentRows = [];
      let referenceKpiRows = [];
      let currentParameterRows = [];
      let parameterKpiCatalog = [];
      let chartsLoaded = false;
      let chartInstances = [];

      function showToast(message) {
        const toast = document.getElementById("toast");
        toast.textContent = message;
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 2400);
      }

      function buildParameterKpiOptionLabel(kpi) {
        return String(kpi.indicator_sub_title || "").trim() || "Untitled KPI";
      }

      function getParameterKpiById(kpiId) {
        return (parameterKpiCatalog || []).find(kpi => String(kpi.kpi_id) === String(kpiId)) || null;
      }

      function updateParameterKpiSummary() {
        const selectedKpi = getParameterKpiById(getParameterFieldValue("parameter_kpi_id"));

      }

      async function loadKpiNames(selectedValue = "") {
        const select = document.getElementById("parameter_kpi_id");
        if (!select) return;

        const res = await fetch("/api/kpis");
        const data = await res.json();
        parameterKpiCatalog = Array.isArray(data) ? data : [];

        const grouped = parameterKpiCatalog.reduce((acc, kpi) => {
          const groupName = String(kpi.subject || "Other KPIs").trim() || "Other KPIs";
          if (!acc[groupName]) acc[groupName] = [];
          acc[groupName].push(kpi);
          return acc;
        }, {});

        const groupMarkup = Object.keys(grouped)
          .sort((a, b) => a.localeCompare(b))
          .map(groupName => {
            const options = grouped[groupName]
              .sort((a, b) => {
                const nameCompare = buildParameterKpiOptionLabel(a).localeCompare(buildParameterKpiOptionLabel(b));
                if (nameCompare !== 0) return nameCompare;
                return String(a.indicator_title || "").localeCompare(String(b.indicator_title || ""));
              })
              .map(kpi =>
                '<option value="' + escapeHtml(kpi.kpi_id) + '">' +
                escapeHtml(buildParameterKpiOptionLabel(kpi)) +
                '</option>'
              ).join("");

            return '<optgroup label="' + escapeHtml(groupName) + '">' + options + '</optgroup>';
          }).join("");

        select.innerHTML =
          '<option value="">Select KPI Name</option>' +
          groupMarkup;

        select.value = selectedValue || "";
        updateParameterKpiSummary();
      }

      function escapeHtml(value) {
        return String(value ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

  function splitMultiValue(value) {
  return String(value || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
}

function getSelectedValues(selectId) {
  const el = document.getElementById(selectId);
  if (!el) return [];
  return Array.from(el.selectedOptions).map(o => o.value).filter(Boolean);
}

function setSelectOptions(selectId, options, placeholder, selectedValue = "") {
  const selectEl = document.getElementById(selectId);
  if (!selectEl) return;

  const uniqueOptions = Array.from(new Set((options || []).filter(Boolean)));

  selectEl.innerHTML =
    '<option value="">' + escapeHtml(placeholder) + '</option>' +
    uniqueOptions.map(option =>
      '<option value="' + escapeHtml(option) + '">' + escapeHtml(option) + '</option>'
    ).join("");

  selectEl.value = selectedValue || "";
  selectEl.disabled = uniqueOptions.length === 0;
}
function getFieldValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || "").trim() : "";
}

const subjectTreeNodeLookup = new Map();
let subjectTreeExpandedIds = new Set();

function registerSubjectTreeNodes(nodes = []) {
  nodes.forEach((node) => {
    if (!node || !node.id) return;

    subjectTreeNodeLookup.set(String(node.id), node);
    registerSubjectTreeNodes(Array.isArray(node.children) ? node.children : []);
  });
}

registerSubjectTreeNodes(Array.isArray(kpiSubjectHierarchy) ? kpiSubjectHierarchy : []);

function getSubjectTreeRoots() {
  return Array.isArray(kpiSubjectHierarchy) ? kpiSubjectHierarchy : [];
}

function getSubjectNode(nodeId) {
  return nodeId ? subjectTreeNodeLookup.get(String(nodeId)) || null : null;
}

function getSubjectNodeParent(nodeId) {
  const node = getSubjectNode(nodeId);
  return node && node.parent_id ? getSubjectNode(node.parent_id) : null;
}

function getSubjectNodeAncestors(nodeId) {
  const ancestors = [];
  let currentNode = getSubjectNode(nodeId);

  while (currentNode && currentNode.parent_id) {
    const parentNode = getSubjectNode(currentNode.parent_id);
    if (!parentNode) break;
    ancestors.unshift(parentNode);
    currentNode = parentNode;
  }

  return ancestors;
}

function getDefaultSubjectTreeExpandedIds() {
  return new Set(getSubjectTreeRoots().map((node) => String(node.id)));
}

function updateSubjectTreeTrigger(node = null, fallbackLabel = "") {
  const labelEl = document.getElementById("subjectTreeLabel");
  const metaEl = document.getElementById("subjectTreeMeta");
  const chevronEl = document.getElementById("subjectTreeChevron");
  const treeSelect = document.getElementById("subjectTreeSelect");

  if (labelEl) {
    labelEl.textContent = node?.name || fallbackLabel || "Select subject from tree";
  }

  if (metaEl) {
    metaEl.textContent = node?.full_path || "Click to browse parent and child nodes from the Excel hierarchy.";
  }

  if (chevronEl && treeSelect) {
    chevronEl.textContent = treeSelect.classList.contains("open") ? "▴" : "▾";
  }
}

function toggleSubjectTree(forceOpen) {
  const treeSelect = document.getElementById("subjectTreeSelect");
  if (!treeSelect) return;

  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : !treeSelect.classList.contains("open");

  treeSelect.classList.toggle("open", shouldOpen);
  updateSubjectTreeTrigger(getSubjectNode(getFieldValue("subject_node_id")));
}

function closeSubjectTree() {
  toggleSubjectTree(false);
}

function toggleSubjectTreeBranch(nodeId) {
  const normalizedId = String(nodeId || "");
  if (!normalizedId) return;

  if (subjectTreeExpandedIds.has(normalizedId)) {
    subjectTreeExpandedIds.delete(normalizedId);
  } else {
    subjectTreeExpandedIds.add(normalizedId);
  }

  renderSubjectTree();
  toggleSubjectTree(true);
}

function renderSubjectTreeNodes(nodes = []) {
  if (!Array.isArray(nodes) || !nodes.length) return "";

  return '<ul class="subject-tree-root">' + nodes.map((node) => {
    const normalizedId = escapeHtml(String(node.id || ""));
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = subjectTreeExpandedIds.has(String(node.id));
    const isSelected = getFieldValue("subject_node_id") === String(node.id);

    return (
      '<li class="subject-tree-item">' +
        '<div class="subject-tree-row">' +
          (hasChildren
            ? '<button type="button" class="subject-tree-toggle" onclick="toggleSubjectTreeBranch('' + normalizedId + '')">' + (isExpanded ? '▾' : '▸') + '</button>'
            : '<span class="subject-tree-toggle placeholder">•</span>') +
          '<button type="button" class="subject-tree-node-btn' + (isSelected ? ' selected' : '') + '" onclick="selectSubjectTreeNode('' + normalizedId + '')">' +
            '<span class="subject-tree-node-name">' + escapeHtml(node.name || "") + '</span>' +
            '<span class="subject-tree-node-path">' + escapeHtml(node.full_path || node.name || "") + '</span>' +
          '</button>' +
        '</div>' +
        (hasChildren && isExpanded ? '<div class="subject-tree-children">' + renderSubjectTreeNodes(node.children) + '</div>' : '') +
      '</li>'
    );
  }).join("") + '</ul>';
}

function renderSubjectTree() {
  const treeList = document.getElementById("subjectTreeList");
  if (!treeList) return;

  treeList.innerHTML = renderSubjectTreeNodes(getSubjectTreeRoots());
}

function findSubjectNodeForValues(values = {}) {
  const subjectText = normalizeNullableFieldValue(values.subject);
  const categoryText = normalizeNullableFieldValue(values.indicator_title);
  const nameText = normalizeNullableFieldValue(values.indicator_sub_title);

  if (subjectText) {
    const directSubjectMatch = Array.from(subjectTreeNodeLookup.values()).find((node) =>
      String(node.full_path || "") === subjectText || String(node.name || "") === subjectText
    );
    if (directSubjectMatch) return directSubjectMatch;
  }

  if (nameText && categoryText) {
    const matches = Array.from(subjectTreeNodeLookup.values()).filter((node) => String(node.name || "") === nameText);
    const parentMatch = matches.find((node) => {
      const parentNode = getSubjectNodeParent(node.id);
      return parentNode && (
        String(parentNode.name || "") === categoryText ||
        String(parentNode.full_path || "") === categoryText
      );
    });

    if (parentMatch) return parentMatch;

    const pathMatch = matches.find((node) => String(node.full_path || "").includes(categoryText));
    if (pathMatch) return pathMatch;
  }

  if (nameText) {
    const nameMatches = Array.from(subjectTreeNodeLookup.values()).filter((node) => String(node.name || "") === nameText);
    if (nameMatches.length === 1) {
      return nameMatches[0];
    }
  }

  return null;
}

function selectSubjectNode(nodeId, { preserveName = false, preserveDefinition = false, fallbackDefinition = "", keepOpen = true } = {}) {
  const node = getSubjectNode(nodeId);
  if (!node) return;

  const parentNode = getSubjectNodeParent(node.id);
  const ancestorIds = getSubjectNodeAncestors(node.id).map((ancestor) => String(ancestor.id));
  ancestorIds.concat(String(node.id)).forEach((id) => subjectTreeExpandedIds.add(id));

  const subjectInput = document.getElementById("subject");
  const subjectNodeInput = document.getElementById("subject_node_id");
  const categoryInput = document.getElementById("indicator_title");
  const nameInput = document.getElementById("indicator_sub_title");
  const pathDisplayInput = document.getElementById("subject_path_display");
  const definitionEl = document.getElementById("definition");

  if (subjectInput) subjectInput.value = node.full_path || node.name || "";
  if (subjectNodeInput) subjectNodeInput.value = node.id || "";
  if (categoryInput) categoryInput.value = parentNode ? parentNode.name || "" : node.name || "";
  if (pathDisplayInput) pathDisplayInput.value = node.full_path || node.name || "";

  if (nameInput && (!preserveName || !String(nameInput.value || "").trim())) {
    nameInput.value = node.name || "";
  }

  if (definitionEl) {
    definitionEl.value = preserveDefinition
      ? (fallbackDefinition || node.description || "")
      : (node.description || fallbackDefinition || "");
  }

  updateSubjectTreeTrigger(node);
  renderSubjectTree();
  toggleSubjectTree(keepOpen);
  updateModalOverview();
}

function selectSubjectTreeNode(nodeId) {
  const node = getSubjectNode(nodeId);
  if (!node) return;

  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  selectSubjectNode(node.id, { keepOpen: hasChildren });
}

function initializeKpiHierarchySelectors(values = {}) {
  subjectTreeExpandedIds = getDefaultSubjectTreeExpandedIds();

  const subjectInput = document.getElementById("subject");
  const subjectNodeInput = document.getElementById("subject_node_id");
  const categoryInput = document.getElementById("indicator_title");
  const nameInput = document.getElementById("indicator_sub_title");
  const pathDisplayInput = document.getElementById("subject_path_display");
  const definitionEl = document.getElementById("definition");

  if (subjectInput) subjectInput.value = "";
  if (subjectNodeInput) subjectNodeInput.value = "";
  if (categoryInput) categoryInput.value = "";
  if (pathDisplayInput) pathDisplayInput.value = "";
  if (nameInput) nameInput.value = values.indicator_sub_title || "";
  if (definitionEl) definitionEl.value = values.definition || "";

  const matchedNode = findSubjectNodeForValues(values);
  if (matchedNode) {
    selectSubjectNode(matchedNode.id, {
      preserveName: true,
      preserveDefinition: true,
      fallbackDefinition: values.definition || "",
      keepOpen: false
    });
  } else {
    if (subjectInput) subjectInput.value = values.subject || "";
    if (categoryInput) categoryInput.value = values.indicator_title || "";
    if (pathDisplayInput) pathDisplayInput.value = values.subject || "";
    updateSubjectTreeTrigger(null, values.subject || "");
    renderSubjectTree();
    closeSubjectTree();
  }
}

function formatReferenceKpiLabel(row) {
  if (!row) return "";

  const parts = [row.indicator_title, row.indicator_sub_title].filter(Boolean);
  return "#" + row.kpi_id + (parts.length ? " - " + parts.join(" / ") : "");
}

function getReferenceKpiCandidates() {
  const currentKpiId = getFieldValue("kpi_id");

  return (referenceKpiRows || []).filter(row =>
    row &&
    row.kpi_id !== undefined &&
    row.kpi_id !== null &&
    String(row.kpi_id) !== String(currentKpiId)
  );
}

function getReferenceKpiRow(referenceKpiId) {
  return (referenceKpiRows || []).find(row => String(row.kpi_id) === String(referenceKpiId)) || null;
}

function populateReferenceKpiOptions(selectedValue = "") {
  const selectEl = document.getElementById("reference_kpi_id");
  if (!selectEl) return;

  const selectedText = String(selectedValue || "").trim();
  const candidates = getReferenceKpiCandidates();
  const options = candidates.map(row => ({
    value: String(row.kpi_id),
    label: formatReferenceKpiLabel(row)
  }));

  if (selectedText && !options.some(option => option.value === selectedText)) {
    options.push({
      value: selectedText,
      label: "#" + selectedText
    });
  }

  selectEl.innerHTML =
    '<option value="">Select reference KPI</option>' +
    options.map(option =>
      '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label) + '</option>'
    ).join("");

  selectEl.value = selectedText;
  selectEl.disabled = options.length === 0;
}

function updateDisplayedKpiPreview() {
  const previewEl = document.getElementById("displayed_kpi_preview");
  if (!previewEl) return;

  const referenceKpiId = getFieldValue("reference_kpi_id");
  const referenceRow = referenceKpiId ? getReferenceKpiRow(referenceKpiId) : null;
  const referenceLabel = referenceRow
    ? [referenceRow.indicator_title, referenceRow.indicator_sub_title].filter(Boolean).join(" / ")
    : "";

  previewEl.value = referenceLabel
    ? "Displayed KPI = Raw value / " + referenceLabel + " x 100"
    : "Displayed KPI = Raw value / Reference KPI x 100";
}

function handleCalculationModeChange() {
  const mode = getFieldValue("calculation_mode").toLowerCase();
  const isRatio = mode === "ratio";

  const referenceWrap = document.getElementById("wrap_reference_kpi_id");
  const displayedWrap = document.getElementById("wrap_displayed_kpi_preview");
  const helpWrap = document.getElementById("wrap_ratio_mode_help");

  if (referenceWrap) referenceWrap.style.display = isRatio ? "" : "none";
  if (displayedWrap) displayedWrap.style.display = isRatio ? "" : "none";
  if (helpWrap) helpWrap.style.display = isRatio ? "" : "none";

  if (isRatio) {
    populateReferenceKpiOptions(getFieldValue("reference_kpi_id"));
    updateDisplayedKpiPreview();
  } else {
    const previewEl = document.getElementById("displayed_kpi_preview");
    if (previewEl) previewEl.value = "";
  }
}

      function setActiveNav(target) {
        document.getElementById("navDashboard").classList.remove("active");
        document.getElementById("navMyKpis").classList.remove("active");
        document.getElementById(target).classList.add("active");
      }

      function showDashboard() {
        document.getElementById("dashboardSection").style.display = "block";
        document.getElementById("myKpisSection").style.display = "none";
        setActiveNav("navDashboard");
      }

      async function showMyKpis() {
        document.getElementById("dashboardSection").style.display = "none";
        document.getElementById("myKpisSection").style.display = "block";
        setActiveNav("navMyKpis");

        if (!chartsLoaded) {
          await loadKpiCharts();
          chartsLoaded = true;
        }
      }

      function updateStats(rows) {
        const total = rows.length;
        const monthly = rows.filter(r => String(r.frequency || "").toLowerCase().includes("month")).length;
        const withTarget = rows.filter(r => r.target !== null && r.target !== undefined && String(r.target).trim() !== "").length;
        const tolerance = rows.filter(r => r.tolerance_type && String(r.tolerance_type).trim() !== "").length;

        document.getElementById("statTotal").textContent = total;
        document.getElementById("statMonthly").textContent = monthly;
        document.getElementById("statTarget").textContent = withTarget;
        document.getElementById("statTolerance").textContent = tolerance;
      }

function renderKpis(rows) {
  currentRows = rows || [];
  updateStats(currentRows);

  const grid = document.getElementById("grid");

  if (!currentRows.length) {
    grid.innerHTML = '<div class="empty">No KPI found for this responsible.</div>';
    return;
  }

  grid.innerHTML = `
    <div class="kpi-table-shell">
      <div class="kpi-table-wrap">
        <table class="kpi-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>KPI</th>
              <th class="kpi-table-actions"></th>
            </tr>
          </thead>
          <tbody>
            ${currentRows.map(row => `
              <tr>
                <td>
                  <div class="kpi-row-title">${escapeHtml(row.indicator_title || "Untitled KPI")}</div>
                </td>
                <td>
                  <div class="kpi-row-subtitle">${escapeHtml(row.indicator_sub_title || "-")}</div>
                </td>
                <td class="kpi-table-actions">
                  <button type="button" class="action-btn edit-btn" onclick="openEditModal(${row.kpi_id})">Edit KPI </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

      function formatParameterDisplayValue(value) {
        if (value === null || value === undefined || value === "") return "-";
        const numeric = Number(value);
        if (Number.isFinite(numeric)) {
          return numeric.toLocaleString("en-US", {
            minimumFractionDigits: Math.abs(numeric % 1) > 0.001 ? 2 : 0,
            maximumFractionDigits: 2
          });
        }
        return String(value);
      }

      function formatParameterDisplayDate(value) {
        if (!value) return "-";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return escapeHtml(value);
        return parsed.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        });
      }

      function renderParameterKpis(rows) {
        currentParameterRows = rows || [];
        const parameterGrid = document.getElementById("parameterGrid");
        if (!parameterGrid) return;

        if (!currentParameterRows.length) {
          parameterGrid.innerHTML = '<div class="empty">No KPI object created yet for this responsible.</div>';
          return;
        }

        parameterGrid.innerHTML = `
          <div class="parameter-table-shell">
            <div class="parameter-table-wrap">
              <table class="parameter-table">
                <thead>
                  <tr>
                    <th>KPI</th>
                    <th>KPI Type</th>
                    <th>Plant / Zone</th>
                    <th>Location</th>
                    <th>Local Currency</th>
                    <th>Value</th>
                    <th>Date</th>
                    <th>Target</th>
                    <th>Best New Target</th>
                    <th>Responsible</th>
                    <th class="parameter-table-actions">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  ${currentParameterRows.map(row => `
                    <tr>
                      <td>
                        <div class="parameter-table-title">${escapeHtml(row.kpi_name || "Not set")}</div>
                        <div class="parameter-table-meta">${escapeHtml([row.kpi_subject, row.kpi_group].filter(Boolean).join(" / ") || "Linked KPI")}</div>
                      </td>
                      <td>
                        <div class="parameter-table-title">${escapeHtml(row.kpi_type || "Not set")}</div>
                      </td>
                      <td>
                        <div class="parameter-table-subvalue">${escapeHtml(row.plant || row.zone || "-")}</div>
                        <div class="parameter-table-meta">${escapeHtml(row.plant ? "Plant" : row.zone ? "Zone" : "No scope")}</div>
                      </td>
                      <td>
                        <div class="parameter-table-subvalue">${escapeHtml(row.location || "-")}</div>
                      </td>
                      <td>
                        <span class="parameter-pill">${escapeHtml(row.local_currency || "-")}</span>
                      </td>
                      <td>${escapeHtml(formatParameterDisplayValue(row.value))}</td>
                      <td>${escapeHtml(formatParameterDisplayDate(row.value_date))}</td>
                      <td>${escapeHtml(formatParameterDisplayValue(row.target))}</td>
                      <td>${escapeHtml(formatParameterDisplayValue(row.best_new_target))}</td>
                      <td>
                        <div class="parameter-table-subvalue">${escapeHtml(row.responsible || responsibleName || "-")}</div>
                        <div class="parameter-table-meta">Assigned owner</div>
                      </td>
                      <td class="parameter-table-actions">
                        <button type="button" class="action-btn edit-btn" onclick="openEditParameterModal(${row.kpi_object_id})">Edit</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        `;
      }

      async function loadParameterKpis() {
        const parameterGrid = document.getElementById("parameterGrid");

        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpi-objects');
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "Failed to load KPI objects");
          }

          renderParameterKpis(data);
        } catch (error) {
          if (parameterGrid) {
            parameterGrid.innerHTML = '<div class="empty">Failed to load KPI objects.</div>';
          }
        }
      }

      function normalizeChartLimitValue(value) {
        if (value === null || value === undefined || value === "") return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
      }

      function getChartValueBandColor(value, lowLimit, highLimit) {
        const numericValue = normalizeChartLimitValue(value);
        const low = normalizeChartLimitValue(lowLimit);
        const high = normalizeChartLimitValue(highLimit);

        if (numericValue === null) return "rgba(148, 163, 184, 0.85)";

        const lowerBound = low !== null && high !== null ? Math.min(low, high) : low;
        const upperBound = low !== null && high !== null ? Math.max(low, high) : high;

        if (upperBound !== null && numericValue > upperBound) {
          return "rgba(239, 68, 68, 0.88)";
        }

        if (lowerBound !== null && numericValue < lowerBound) {
          return "rgba(22, 163, 74, 0.92)";
        }

        return "rgba(74, 222, 128, 0.88)";
      }

      function getChartValueBorderColor(value, lowLimit, highLimit) {
        const color = getChartValueBandColor(value, lowLimit, highLimit);
        if (color.includes("239, 68, 68")) return "rgba(220, 38, 38, 1)";
        if (color.includes("22, 163, 74")) return "rgba(21, 128, 61, 1)";
        return "rgba(22, 163, 74, 1)";
      }

      const kpiThresholdBandsPlugin = {
        id: "kpiThresholdBands",
        beforeDatasetsDraw(chart, args, pluginOptions) {
          const low = normalizeChartLimitValue(pluginOptions?.lowLimit);
          const high = normalizeChartLimitValue(pluginOptions?.highLimit);
          const yScale = chart.scales?.y;
          const area = chart.chartArea;

          if (!yScale || !area || (low === null && high === null)) return;

          const lowerBound = low !== null && high !== null ? Math.min(low, high) : low;
          const upperBound = low !== null && high !== null ? Math.max(low, high) : high;

          const drawBand = (fromValue, toValue, fillStyle) => {
            if (fromValue === null || toValue === null) return;
            const startY = yScale.getPixelForValue(fromValue);
            const endY = yScale.getPixelForValue(toValue);
            if (!Number.isFinite(startY) || !Number.isFinite(endY)) return;

            const top = Math.min(startY, endY);
            const height = Math.abs(endY - startY);
            if (!height) return;

            chart.ctx.fillStyle = fillStyle;
            chart.ctx.fillRect(area.left, top, area.right - area.left, height);
          };

          chart.ctx.save();
          chart.ctx.beginPath();
          chart.ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
          chart.ctx.clip();

          if (upperBound !== null) {
            drawBand(yScale.max, upperBound, "rgba(254, 226, 226, 0.55)");
          }

          if (lowerBound !== null && upperBound !== null) {
            drawBand(upperBound, lowerBound, "rgba(220, 252, 231, 0.55)");
          } else if (upperBound !== null) {
            drawBand(upperBound, yScale.min, "rgba(220, 252, 231, 0.55)");
          }

          if (lowerBound !== null) {
            drawBand(lowerBound, yScale.min, "rgba(187, 247, 208, 0.55)");
          }

          chart.ctx.restore();
        }
      };

      const kpiFlowLinePlugin = {
        id: "kpiFlowLine",
        afterDatasetsDraw(chart, args, pluginOptions) {
          const datasetIndex = Number.isInteger(pluginOptions?.datasetIndex)
            ? pluginOptions.datasetIndex
            : 0;
          const meta = chart.getDatasetMeta(datasetIndex);
          const area = chart.chartArea;

          if (!meta?.data?.length || !area) return;

          const offset = Number.isFinite(pluginOptions?.offset) ? pluginOptions.offset : 12;
          const pointRadius = Number.isFinite(pluginOptions?.pointRadius) ? pluginOptions.pointRadius : 3.5;
          const points = [];

          meta.data.forEach((barElement, index) => {
            const rawValue = chart.data?.datasets?.[datasetIndex]?.data?.[index];
            const numericValue = Number(rawValue);

            if (!Number.isFinite(numericValue) || !Number.isFinite(barElement?.x) || !Number.isFinite(barElement?.y)) {
              return;
            }

            points.push({
              x: barElement.x,
              y: Math.max(barElement.y - offset, area.top + 8)
            });
          });

          if (points.length < 2) return;

          const ctx = chart.ctx;
          const strokeStyle = pluginOptions?.color || "rgba(15, 23, 42, 0.92)";
          const pointFill = pluginOptions?.pointFill || "rgba(15, 23, 42, 0.96)";
          const pointStroke = pluginOptions?.pointStroke || "rgba(255, 255, 255, 0.98)";
          const lineWidth = Number.isFinite(pluginOptions?.lineWidth) ? pluginOptions.lineWidth : 3;

          ctx.save();
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = strokeStyle;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);

          for (let index = 1; index < points.length; index += 1) {
            const previousPoint = points[index - 1];
            const currentPoint = points[index];
            const midX = (previousPoint.x + currentPoint.x) / 2;
            const midY = (previousPoint.y + currentPoint.y) / 2;
            ctx.quadraticCurveTo(previousPoint.x, previousPoint.y, midX, midY);
          }

          const lastPoint = points[points.length - 1];
          ctx.lineTo(lastPoint.x, lastPoint.y);
          ctx.stroke();

          points.forEach((point) => {
            ctx.beginPath();
            ctx.fillStyle = pointFill;
            ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = pointStroke;
            ctx.stroke();
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
          });

          ctx.restore();
        }
      };

      async function loadKpis(search = "") {
        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpis?search=' + encodeURIComponent(search));
          const data = await res.json();
          renderKpis(data);
        } catch (error) {
          document.getElementById("grid").innerHTML =
            '<div class="empty">Failed to load KPIs.</div>';
        }
      }

      async function loadReferenceKpis() {
        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpis?search=');
          const data = await res.json();
          referenceKpiRows = Array.isArray(data) ? data : [];
        } catch (error) {
          referenceKpiRows = Array.isArray(currentRows) ? currentRows.slice() : [];
        }
      }

      async function loadKpiCharts() {
        const chartsGrid = document.getElementById("chartsGrid");

        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpi-history-monthly');
          if (!res.ok) throw new Error("Failed to load chart data");

          const rows = await res.json();

          if (!rows.length) {
            chartsGrid.innerHTML = '<div class="empty">No KPI history found for this responsible.</div>';
            return;
          }

          chartsGrid.innerHTML = rows.map((row, index) =>
            '<div class="chart-card">' +
              '<h3>' + escapeHtml(row.indicator_title || "Untitled KPI") + '</h3>' +
              '<p>' + escapeHtml(row.indicator_sub_title || "Monthly KPI history") + '</p>' +
              '<div class="chart-meta">' +
                '<div class="chart-chip chart-chip-target">Target: ' + escapeHtml(row.targetValue ?? "-") + '</div>' +
                '<div class="chart-chip chart-chip-high">High Limit: ' + escapeHtml(row.highLimitValue ?? "-") + '</div>' +
                '<div class="chart-chip chart-chip-low">Low Limit: ' + escapeHtml(row.lowLimitValue ?? "-") + '</div>' +
              '</div>' +
              '<div class="chart-wrap">' +
                '<canvas id="chart_' + index + '"></canvas>' +
              '</div>' +
            '</div>'
          ).join("");

          chartInstances.forEach(chart => chart.destroy());
          chartInstances = [];

          rows.forEach((row, index) => {
            const canvas = document.getElementById('chart_' + index);
            const ctx = canvas.getContext('2d');
            const sourceLabels = Array.isArray(row.labels) ? row.labels : [];
            const periodLabels = sourceLabels.map((_, labelIndex) => 'Period ' + (labelIndex + 1));

            const targetSeries = Array.isArray(sourceLabels)
              ? sourceLabels.map(() => row.targetValue ?? null)
              : [];

            const highLimitSeries = Array.isArray(sourceLabels)
              ? sourceLabels.map(() => row.highLimitValue ?? null)
              : [];

            const lowLimitSeries = Array.isArray(sourceLabels)
              ? sourceLabels.map(() => row.lowLimitValue ?? null)
              : [];
            const barColors = Array.isArray(row.values)
              ? row.values.map(value => getChartValueBandColor(value, row.lowLimitValue, row.highLimitValue))
              : [];
            const barBorderColors = Array.isArray(row.values)
              ? row.values.map(value => getChartValueBorderColor(value, row.lowLimitValue, row.highLimitValue))
              : [];
            const axisValues = [
              ...(Array.isArray(row.values) ? row.values : []),
              ...targetSeries,
              ...highLimitSeries,
              ...lowLimitSeries
            ]
              .filter((value) => value !== null && value !== undefined && value !== '')
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value));
            const axisSourceMin = axisValues.length ? Math.min(...axisValues) : 0;
            const axisSourceMax = axisValues.length ? Math.max(...axisValues) : 100;
            let axisMin = axisSourceMin > 0
              ? axisSourceMin * 0.8
              : axisSourceMin < 0
                ? axisSourceMin * 1.2
                : 0;
            let axisMax = axisSourceMax > 0
              ? axisSourceMax * 1.2
              : axisSourceMax < 0
                ? axisSourceMax * 0.8
                : 0;
            if (axisSourceMin === axisSourceMax) {
              const pad = Math.max(Math.abs(axisSourceMax || axisSourceMin || 1) * 0.2, 1);
              axisMin = axisSourceMin - pad;
              axisMax = axisSourceMax + pad;
            }

            const chart = new Chart(ctx, {
              data: {
                labels: periodLabels,
                datasets: [
                  {
                    type: 'bar',
                    label: 'Actual Value',
                    data: row.values,
                    borderWidth: 1,
                    borderColor: barBorderColors,
                    backgroundColor: barColors,
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 26
                  },
                  {
                    type: 'line',
                    label: 'Target',
                    data: targetSeries,
                    borderColor: 'rgba(239, 68, 68, 0.95)',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    borderWidth: 2,
                    tension: 0,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderDash: [6, 4]
                  },
                  {
                    type: 'line',
                    label: 'High Limit',
                    data: highLimitSeries,
                    borderColor: 'rgba(245, 158, 11, 0.95)',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 2,
                    tension: 0,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderDash: [8, 5]
                  },
                  {
                    type: 'line',
                    label: 'Low Limit',
                    data: lowLimitSeries,
                    borderColor: 'rgba(59, 130, 246, 0.95)',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderWidth: 2,
                    tension: 0,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    borderDash: [8, 5]
                  }
                ]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  kpiThresholdBands: {
                    lowLimit: row.lowLimitValue,
                    highLimit: row.highLimitValue
                  },
                  kpiFlowLine: {
                    datasetIndex: 0,
                    offset: 12,
                    lineWidth: 3,
                    pointRadius: 3.5
                  },
                  legend: {
                    display: false
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      title(items) {
                        const indexValue = items?.[0]?.dataIndex ?? 0;
                        return periodLabels[indexValue] || '';
                      },
                      footer(items) {
                        const indexValue = items?.[0]?.dataIndex ?? 0;
                        return sourceLabels[indexValue] ? 'Source: ' + sourceLabels[indexValue] : '';
                      }
                    }
                  }
                },
                interaction: {
                  mode: 'nearest',
                  axis: 'x',
                  intersect: false
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Period',
                      color: '#0f172a',
                      font: {
                        size: 13,
                        weight: '700'
                      }
                    },
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: '#64748b'
                    }
                  },
                  y: {
                    beginAtZero: false,
                    min: axisMin,
                    max: axisMax,
                    title: {
                      display: true,
                      text: 'Value',
                      color: '#0f172a',
                      font: {
                        size: 13,
                        weight: '700'
                      }
                    },
                    ticks: {
                      color: '#64748b'
                    },
                    grid: {
                      color: 'rgba(148,163,184,0.15)'
                    }
                  }
                }
              },
              plugins: [kpiThresholdBandsPlugin, kpiFlowLinePlugin]
            });

            chartInstances.push(chart);
          });
        } catch (error) {
          console.error(error);
          chartsGrid.innerHTML = '<div class="empty">Failed to load KPI charts.</div>';
        }
      }

      async function refreshKpis() {
        await loadKpis(document.getElementById("search").value || "");
        await loadParameterKpis();
        showToast("Dashboard refreshed");
      }

      function openModal() {
        document.getElementById("modalBackdrop").classList.add("open");
      }

      function closeModal() {
        document.getElementById("modalBackdrop").classList.remove("open");
      }

      function openParameterModal() {
        document.getElementById("parameterModalBackdrop").classList.add("open");
      }

      function closeParameterModal() {
        document.getElementById("parameterModalBackdrop").classList.remove("open");
      }

      function getParameterFieldValue(id) {
        const element = document.getElementById(id);
        return element ? String(element.value || "").trim() : "";
      }

      function updateParameterOverview() {
   
      }

      function getFieldValue(id) {
        const element = document.getElementById(id);
        return element ? String(element.value || "").trim() : "";
      }

      function updateModalOverview() {
        const isEdit = !!getFieldValue("kpi_id");
        document.getElementById("modalModeBadge").textContent = isEdit ? "Edit KPI" : "Create KPI";
        document.getElementById("overviewFrequency").textContent =
          getFieldValue("frequency") || "Not set";
        document.getElementById("overviewUnit").textContent =
          getFieldValue("unit") || "Not set";
       
      }

      function normalizeLimitInput(value, allowPercent = false) {
        if (value === null || value === undefined) return null;
        let normalized = String(value).trim();
        if (!normalized) return null;

        normalized = normalized.replace(/\s+/g, "").replace(/,/g, ".");
        if (allowPercent && normalized.endsWith("%")) {
          normalized = normalized.slice(0, -1);
        }

        return /^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized) ? normalized : null;
      }

      function parseLimitNumber(value, allowPercent = false) {
        const normalized = normalizeLimitInput(value, allowPercent);
        return normalized === null ? null : Number(normalized);
      }

      function formatCalculatedLimit(value) {
        if (!Number.isFinite(value)) return "";
        return value.toFixed(10).replace(/\.?0+$/, "");
      }

      function isRelativeToleranceType(toleranceType) {
        return String(toleranceType || "").trim().toLowerCase() === "relative";
      }

      function parseToleranceInputValue(value) {
        if (value === null || value === undefined) {
          return { text: "", numeric: null, hasPercent: false };
        }

        const text = String(value).trim();
        if (!text) {
          return { text: "", numeric: null, hasPercent: false };
        }

        const normalized = normalizeLimitInput(text, true);
        return {
          text,
          numeric: normalized === null ? null : Number(normalized),
          hasPercent: text.includes("%")
        };
      }

      function parseToleranceDelta(value, toleranceType, direction = "up") {
        const { numeric, hasPercent } = parseToleranceInputValue(value);
        if (!Number.isFinite(numeric)) return null;

        let delta = numeric;

        if (isRelativeToleranceType(toleranceType)) {
          delta = hasPercent || Math.abs(delta) > 1 ? delta / 100 : delta;
        }

        if (direction === "up") {
          return Math.abs(delta);
        }

        return delta > 0 ? -delta : delta;
      }

      function formatToleranceForInput(value, toleranceType, direction = "up") {
        const parsed = parseToleranceInputValue(value);
        if (!parsed.text) return "";
        if (!Number.isFinite(parsed.numeric)) return parsed.text;

        let displayValue = parsed.numeric;

        if (isRelativeToleranceType(toleranceType)) {
          displayValue = parsed.hasPercent || Math.abs(displayValue) > 1
            ? displayValue
            : displayValue * 100;
        }

        if (direction === "up") {
          displayValue = Math.abs(displayValue);
        } else if (displayValue > 0) {
          displayValue = -displayValue;
        }

        const suffix = isRelativeToleranceType(toleranceType) ? "%" : "";
        return formatCalculatedLimit(displayValue) + suffix;
      }

      function formatToleranceForDisplay(value, toleranceType, direction = "up") {
        return formatToleranceForInput(value, toleranceType, direction);
      }

      function serializeToleranceForPayload(value, toleranceType, direction = "up") {
        const parsed = parseToleranceInputValue(value);
        if (!parsed.text) return "";

        const delta = parseToleranceDelta(value, toleranceType, direction);
        return Number.isFinite(delta) ? formatCalculatedLimit(delta) : parsed.text;
      }

      function getLimitFields(source = null) {
        const root = source && typeof source.closest === "function"
          ? source.closest("#modalBackdrop") || source.closest(".modal") || document
          : document;

        return {
          targetInput: root.querySelector("#target") || document.getElementById("target"),
          toleranceTypeInput: root.querySelector("#tolerance_type") || document.getElementById("tolerance_type"),
          upToleranceInput: root.querySelector("#up_tolerance") || document.getElementById("up_tolerance"),
          lowToleranceInput: root.querySelector("#low_tolerance") || document.getElementById("low_tolerance"),
          highLimitInput: root.querySelector("#high_limit") || document.getElementById("high_limit"),
          lowLimitInput: root.querySelector("#low_limit") || document.getElementById("low_limit")
        };
      }

function syncToleranceInputs(source = null) {
    const {
      toleranceTypeInput,
      upToleranceInput,
      lowToleranceInput,
      highLimitInput,
      lowLimitInput
    } = getLimitFields(source);

    if (!toleranceTypeInput) return;

    const toleranceType = String(toleranceTypeInput.value || "").trim().toLowerCase();
    const isAbsolute = toleranceType === "absolute";
    const isRelative = toleranceType === "relative";

    // Show/hide wrapper divs
    const wrapUp   = document.getElementById("wrap_up_tolerance");
    const wrapLow  = document.getElementById("wrap_low_tolerance");
    const wrapHigh = document.getElementById("wrap_high_limit");
    const wrapLowL = document.getElementById("wrap_low_limit");

    if (wrapUp)   wrapUp.style.display   = isRelative ? "" : "none";
    if (wrapLow)  wrapLow.style.display  = isRelative ? "" : "none";
    if (wrapHigh) wrapHigh.style.display = isAbsolute ? "" : "none";
    if (wrapLowL) wrapLowL.style.display = isAbsolute ? "" : "none";

    // Clear hidden fields so stale values aren't submitted
    if (isAbsolute && upToleranceInput)  upToleranceInput.value  = "";
    if (isAbsolute && lowToleranceInput) lowToleranceInput.value = "";
    if (isRelative && highLimitInput)    highLimitInput.value    = "";
    if (isRelative && lowLimitInput)     lowLimitInput.value     = "";

    // Format tolerance display for Relative
    if (isRelative) {
      if (upToleranceInput && String(upToleranceInput.value || "").trim()) {
        upToleranceInput.value = formatToleranceForInput(upToleranceInput.value, toleranceType, "up");
      }
      if (lowToleranceInput && String(lowToleranceInput.value || "").trim()) {
        lowToleranceInput.value = formatToleranceForInput(lowToleranceInput.value, toleranceType, "low");
      }
    }
  }

      function handleToleranceTypeChange(source) {
        syncToleranceInputs(source);
        recalculateLimits(source);
      }

function recalculateLimits(sourceOrOptions = {}, maybeOptions = {}) {
  const source = sourceOrOptions && typeof sourceOrOptions.closest === "function"
    ? sourceOrOptions
    : null;

  const {
    targetInput,
    toleranceTypeInput,
    upToleranceInput,
    lowToleranceInput,
    highLimitInput,
    lowLimitInput
  } = getLimitFields(source);

  const toleranceType = String(toleranceTypeInput?.value || "").trim().toLowerCase();

  // Absolute = DO NOTHING
  if (toleranceType === "absolute") {
    return;
  }

  // Only Relative can calculate
  if (toleranceType !== "relative") {
    return;
  }

  const targetValue = parseLimitNumber(targetInput?.value);
  const upToleranceValue = parseToleranceDelta(upToleranceInput?.value, toleranceType, "up");
  const lowToleranceValue = parseToleranceDelta(lowToleranceInput?.value, toleranceType, "low");

  if (
    !Number.isFinite(targetValue) ||
    !Number.isFinite(upToleranceValue) ||
    !Number.isFinite(lowToleranceValue)
  ) {
    return;
  }

  highLimitInput.value = formatCalculatedLimit(targetValue * (1 + upToleranceValue));
  lowLimitInput.value = formatCalculatedLimit(targetValue * (1 + lowToleranceValue));
}

      function bindOverviewListeners() {
        ["frequency", "unit", "target"].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.addEventListener("input", updateModalOverview);
            el.addEventListener("change", updateModalOverview);
          }
        });
      }


      function bindHierarchyListeners() {
  const nameEl = document.getElementById("indicator_sub_title");
  const definitionEl = document.getElementById("definition");
  const treeTrigger = document.getElementById("subjectTreeTrigger");

  if (treeTrigger) {
    treeTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeSubjectTree();
      }
    });
  }

  if (nameEl) {
    ["input", "change"].forEach((eventName) => {
      nameEl.addEventListener(eventName, () => {
        updateModalOverview();
      });
    });
  }

  if (definitionEl) {
    ["input", "change"].forEach((eventName) => {
      definitionEl.addEventListener(eventName, () => {
        updateModalOverview();
      });
    });
  }

  document.addEventListener("click", (event) => {
    const treeSelect = document.getElementById("subjectTreeSelect");
    if (!treeSelect) return;

    if (!treeSelect.contains(event.target)) {
      closeSubjectTree();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSubjectTree();
      updateModalOverview();
    }
  });
}
      function bindLimitListeners() {
        ["target", "up_tolerance", "low_tolerance"].forEach(id => {
          const el = document.getElementById(id);
          if (el) {
            el.addEventListener("input", (event) => recalculateLimits(event.target));
          }
        });

        const toleranceType = document.getElementById("tolerance_type");
        if (toleranceType) {
          toleranceType.addEventListener("change", (event) => handleToleranceTypeChange(event.target));
        }
      }

     function handleCalculationOnChange() {
  const value = document.getElementById("calculation_on")?.value;
  const wrap = document.getElementById("wrap_nombre_periode");
  if (wrap) wrap.style.display = value === "Value" || value === "Average" ? "" : "none";
}

function handleDisplayTrendChange() {
  const value = document.getElementById("display_trend")?.value;
  const wrap = document.getElementById("wrap_regression");
  if (wrap) wrap.style.display = value === "Yes" ? "" : "none";
}

function normalizeNullableFieldValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const lowered = text.toLowerCase();
  if (lowered === "none" || lowered === "null" || lowered === "undefined" || lowered === "nan") {
    return "";
  }

  return text;
}

function inferValueType(value) {
  const text = normalizeNullableFieldValue(value);
  if (!text) return "Null";
  if (!Number.isNaN(Number(text)) && Number(text) === 0) return "0";
  return "Valeur a entrer";
}

function handleMinTypeChange() {
  const value = document.getElementById("min_type")?.value;
  const wrap = document.getElementById("wrap_min_value");
  const input = document.getElementById("min");

  if (wrap) wrap.style.display = value === "Valeur a entrer" ? "" : "none";
  if (!input) return;

  if (value === "Null") input.value = "";
  if (value === "0") input.value = "0";
  if (value === "Valeur a entrer" && input.value === "0") input.value = "";
}

function handleMaxTypeChange() {
  const value = document.getElementById("max_type")?.value;
  const wrap = document.getElementById("wrap_max_value");
  const input = document.getElementById("max");

  if (wrap) wrap.style.display = value === "Valeur a entrer" ? "" : "none";
  if (!input) return;

  if (value === "Null") input.value = "";
  if (value === "0") input.value = "0";
  if (value === "Valeur a entrer" && input.value === "0") input.value = "";
}


function resetForm() {
  [
    "kpi_id",
    "unit",
    "definition",
    "frequency",
    "target",
    "tolerance_type",
    "up_tolerance",
    "low_tolerance",
    "max",
    "min",
    "calculation_on",
    "target_auto_adjustment",
    "high_limit",
    "low_limit",
    "direction",
    "nombre_periode",
    "calculation_mode",
    "reference_kpi_id",
    "display_trend",
    "regression",
    "min_type",
    "max_type"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  const toleranceTypeEl = document.getElementById("tolerance_type");
  if (toleranceTypeEl) toleranceTypeEl.value = "Relative";

  const displayTrendEl = document.getElementById("display_trend");
  if (displayTrendEl) displayTrendEl.value = "No";

  const calculationModeEl = document.getElementById("calculation_mode");
  if (calculationModeEl) calculationModeEl.value = "Direct";

  const minTypeEl = document.getElementById("min_type");
  if (minTypeEl) minTypeEl.value = "Null";

  const maxTypeEl = document.getElementById("max_type");
  if (maxTypeEl) maxTypeEl.value = "0";

  handleCalculationOnChange();
  handleDisplayTrendChange();
  handleMinTypeChange();
  handleMaxTypeChange();
  populateReferenceKpiOptions("");
  handleCalculationModeChange();

  initializeKpiHierarchySelectors({
    subject: "",
    indicator_title: "",
    indicator_sub_title: "",
    definition: ""
  });
  updateModalOverview();
  syncToleranceInputs();
  recalculateLimits();
}

function setFieldValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;

  const finalValue = value ?? "";

  if (el.tagName === "SELECT" && finalValue !== "") {
    const exists = Array.from(el.options).some(opt => opt.value === String(finalValue));
    if (!exists) {
      el.insertAdjacentHTML(
        "beforeend",
        '<option value="' + escapeHtml(finalValue) + '">' + escapeHtml(finalValue) + '</option>'
      );
    }
  }

  el.value = finalValue;
}


function fillForm(data) {
  setFieldValue("kpi_id", data.kpi_id);

  initializeKpiHierarchySelectors({
    subject: data.subject || "",
    indicator_title: data.indicator_title || "",
    indicator_sub_title: data.indicator_sub_title || "",
    definition: data.definition || ""
  });

  setFieldValue("unit", data.unit);
  setFieldValue("definition", data.definition);
  setFieldValue("frequency", data.frequency);
  setFieldValue("direction", data.target_direction);

  setFieldValue("calculation_on", data.calculation_on);
  setFieldValue("nombre_periode", data.nombre_periode);
  setFieldValue("calculation_mode", data.calculation_mode || "Direct");
  populateReferenceKpiOptions(data.reference_kpi_id);
  setFieldValue("reference_kpi_id", data.reference_kpi_id);
  setFieldValue("display_trend", data.display_trend);
  setFieldValue("regression", data.regression);

  setFieldValue("target", data.target);
  setFieldValue("target_auto_adjustment", data.target_auto_adjustment);

  setFieldValue("min_type", data.min_type || inferValueType(data.min));
  setFieldValue("max_type", data.max_type || inferValueType(data.max));
  setFieldValue("min", normalizeNullableFieldValue(data.min));
  setFieldValue("max", normalizeNullableFieldValue(data.max));

  setFieldValue("tolerance_type", data.tolerance_type || "Relative");
  setFieldValue("up_tolerance", formatToleranceForInput(data.up_tolerance, data.tolerance_type, "up"));
  setFieldValue("low_tolerance", formatToleranceForInput(data.low_tolerance, data.tolerance_type, "low"));
  setFieldValue("high_limit", data.high_limit);
  setFieldValue("low_limit", data.low_limit);

  handleCalculationOnChange();
  handleDisplayTrendChange();
  handleMinTypeChange();
  handleMaxTypeChange();
  handleCalculationModeChange();
  syncToleranceInputs();
  updateModalOverview();
}

      async function openCreateModal() {
        await loadReferenceKpis();
        resetForm();
        document.getElementById("modalTitle").textContent = "Add New KPI";
        document.getElementById("modalSubtitle").textContent =
          "Create a new KPI with clear identity, target logic and threshold visibility.";
        document.getElementById("deleteBtn").style.display = "none";
        updateModalOverview();
        openModal();
      }

      async function openEditModal(kpiId) {
        try {
          await loadReferenceKpis();
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpis/' + kpiId);
          if (!res.ok) throw new Error("Failed to load KPI");

          const data = await res.json();
          fillForm(data);
          handleCalculationOnChange();
          handleDisplayTrendChange();
          handleMinTypeChange();
          handleMaxTypeChange();

          document.getElementById("modalTitle").textContent = "Edit KPI Attributes";
          document.getElementById("modalSubtitle").textContent =
            "";
          document.getElementById("deleteBtn").style.display = "inline-flex";

          updateModalOverview();
          openModal();
        } catch (error) {
        console.error("OPEN EDIT MODAL ERROR:", error);
        showToast("Unable to load KPI: " + error.message);
         } 
      }


        function getSafeValue(id) {
      const el = document.getElementById(id);
     if (!el) {
      console.error("Missing field:", id);
    return "";
     }
     return el.value || "";
    }

      function buildPayload() {
        const toleranceType = document.getElementById("tolerance_type").value;
        const minType = document.getElementById("min_type")?.value || "Null";
        const maxType = document.getElementById("max_type")?.value || "Null";
        const minValue = normalizeNullableFieldValue(document.getElementById("min")?.value);
        const maxValue = normalizeNullableFieldValue(document.getElementById("max")?.value);
        return {
          indicator_title: document.getElementById("indicator_title").value,
          indicator_sub_title: document.getElementById("indicator_sub_title").value,
          unit: document.getElementById("unit").value,
          subject: document.getElementById("subject").value,
          definition: document.getElementById("definition").value,
          frequency: document.getElementById("frequency").value,
          target: getSafeValue("target"),
          tolerance_type: toleranceType,
          up_tolerance: serializeToleranceForPayload(document.getElementById("up_tolerance").value, toleranceType, "up"),
          low_tolerance: serializeToleranceForPayload(document.getElementById("low_tolerance").value, toleranceType, "low"),
          max: maxType === "Null" ? "" : maxType === "0" ? "0" : maxValue,
          min: minType === "Null" ? "" : minType === "0" ? "0" : minValue,
          calculation_on: document.getElementById("calculation_on").value,
          target_auto_adjustment: document.getElementById("target_auto_adjustment").value,
          target_direction: document.getElementById("direction").value,
          nombre_periode: document.getElementById("nombre_periode").value,
          calculation_mode: document.getElementById("calculation_mode").value,
          reference_kpi_id: document.getElementById("calculation_mode").value === "Ratio"
            ? (document.getElementById("reference_kpi_id").value || null)
            : null,
          display_trend: document.getElementById("display_trend").value,
          regression: document.getElementById("regression").value,
          min_type: document.getElementById("min_type").value,
          max_type: document.getElementById("max_type").value,
          high_limit: document.getElementById("high_limit").value || null,
          low_limit: document.getElementById("low_limit").value || null
        };
      }

      async function saveKpi() {
        const kpiId = document.getElementById("kpi_id").value;
        const method = kpiId ? "PUT" : "POST";
        const url = kpiId
          ? '/api/responsibles/' + responsibleId + '/kpis/' + kpiId
          : '/api/responsibles/' + responsibleId + '/kpis';

        try {
          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildPayload())
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            showToast(errorData?.error || "Save failed");
            return;
          }

          closeModal();
          await loadKpis(document.getElementById("search").value || "");
          showToast(kpiId ? "KPI updated successfully" : "KPI created successfully");
        } catch (error) {
          console.error("SAVE KPI ERROR:", error);
          showToast("Save failed: " + error.message);
        }
      }

  const plantResponsibleMap = {
  Tunisia: "Imed Ben Alaya",
  Mexico: "Hetcor Olivares",
  Kunshan: "Allan Regell",
  Tianjin: "Yang Yang",
  Anhui: "Allan Regell",
  Korea: "Samtak Joo",
  Chennai: "Sridhar BOOVARAGHAVAN",
  Poitiers: "Sebastien Charpentier"
};

function handleKpiTypeChange() {
  const type = document.getElementById("parameter_kpi_type").value;
  const plantWrap = document.getElementById("plantWrap");
  const zoneWrap = document.getElementById("zoneWrap");
  const responsibleInput = document.getElementById("parameter_responsible_name");

  plantWrap.style.display = type === "Multisite" ? "" : "none";
  zoneWrap.style.display = type === "Zone" ? "" : "none";

  document.getElementById("parameter_plant").value = "";
  document.getElementById("parameter_zone").value = "";

  if (type === "Individual") {
    responsibleInput.readOnly = false;
    responsibleInput.value = responsibleName || "";
  } else {
    responsibleInput.readOnly = true;
    responsibleInput.value = responsibleName || "";
  }
}

function handlePlantChange() {
  const plant = document.getElementById("parameter_plant").value;
  document.getElementById("parameter_responsible_name").value =
    plantResponsibleMap[plant] || "";
}


      async function deleteCurrentKpi() {
        const kpiId = document.getElementById("kpi_id").value;
        if (!kpiId) return;

        const ok = confirm("Delete this KPI?");
        if (!ok) return;

        await deleteKpi(kpiId, true);
      }

      async function deleteKpi(kpiId, fromModal = false) {
        const ok = fromModal ? true : confirm("Delete this KPI?");
        if (!ok) return;

        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpis/' + kpiId, {
            method: "DELETE"
          });

          if (!res.ok) {
            showToast("Delete failed");
            return;
          }

          if (fromModal) closeModal();
          await loadKpis(document.getElementById("search").value || "");
          showToast("KPI deleted");
        } catch (error) {
          showToast("Delete failed");
        }
      }

      function formatParameterDateForInput(value) {
        if (!value) return "";
        const text = String(value).trim();
        return text.length >= 10 ? text.slice(0, 10) : text;
      }

      function resetParameterForm() {
        [
          "parameter_object_id",
          "parameter_kpi_id",
          "parameter_kpi_type",
          "parameter_plant",
          "parameter_zone",
          "parameter_location",
          "parameter_local_currency",
          "parameter_value",
          "parameter_value_date",
          "parameter_target",
          "parameter_best_new_target"
        ].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });

        const responsibleInput = document.getElementById("parameter_responsible_name");
        if (responsibleInput) {
          responsibleInput.value = responsibleName || "";
          responsibleInput.readOnly = true;
        }

        const valueDateInput = document.getElementById("parameter_value_date");
        if (valueDateInput) {
          valueDateInput.value = new Date().toISOString().slice(0, 10);
        }

        document.getElementById("parameterDeleteBtn").style.display = "none";
        handleKpiTypeChange();
        updateParameterOverview();
        updateParameterKpiSummary();
      }

      function fillParameterForm(data) {
        const mappings = {
          parameter_object_id: data.kpi_object_id,
          parameter_kpi_id: data.kpi_id,
          parameter_kpi_type: data.kpi_type,
          parameter_plant: data.plant,
          parameter_zone: data.zone,
          parameter_location: data.location,
          parameter_local_currency: data.local_currency,
          parameter_value: data.value ?? "",
          parameter_value_date: formatParameterDateForInput(data.value_date),
          parameter_target: data.target ?? "",
          parameter_best_new_target: data.best_new_target ?? ""
        };

        Object.keys(mappings).forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = mappings[id] ?? "";
        });

        const responsibleInput = document.getElementById("parameter_responsible_name");
        if (responsibleInput) {
          responsibleInput.value = data.responsible || responsibleName || "";
        }

        handleKpiTypeChange();
        if (document.getElementById("parameter_plant")) {
          document.getElementById("parameter_plant").value = data.plant || "";
        }
        if (document.getElementById("parameter_zone")) {
          document.getElementById("parameter_zone").value = data.zone || "";
        }
        if (responsibleInput) {
          responsibleInput.value = data.responsible || responsibleName || "";
        }
        updateParameterOverview();
        updateParameterKpiSummary();
      }

      async function openCreateParameterModal() {
        await loadKpiNames();
        resetParameterForm();
        document.getElementById("parameterModalTitle").textContent = "Create KPI Object";
        document.getElementById("parameterModalSubtitle").textContent =
          "Create a KPI object with location, currency, target and ownership details for this responsible.";
        openParameterModal();
      }

      async function openEditParameterModal(parameterObjectId) {
        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpi-objects/' + parameterObjectId);
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "Failed to load KPI object");
          }

          await loadKpiNames(data.kpi_id);
          fillParameterForm(data);
          document.getElementById("parameterModalTitle").textContent = "Edit KPI Object";
          document.getElementById("parameterModalSubtitle").textContent =
            "Update location, plant or zone, value, target and ownership details in one clear workflow.";
          document.getElementById("parameterDeleteBtn").style.display = "inline-flex";
          openParameterModal();
        } catch (error) {
          console.error("OPEN KPI OBJECT MODAL ERROR:", error);
          showToast("Unable to load KPI object: " + error.message);
        }
      }

  function buildParameterPayload() {
   return {
    kpi_id: getParameterFieldValue("parameter_kpi_id"),
    kpi_type: getParameterFieldValue("parameter_kpi_type"),
    plant: getParameterFieldValue("parameter_plant"),
    zone: getParameterFieldValue("parameter_zone"),
    location: getParameterFieldValue("parameter_location"),
    local_currency: getParameterFieldValue("parameter_local_currency"),
    responsible: getParameterFieldValue("parameter_responsible_name"),
    value: getParameterFieldValue("parameter_value"),
    value_date: getParameterFieldValue("parameter_value_date"),
    target: getParameterFieldValue("parameter_target"),
    best_new_target: getParameterFieldValue("parameter_best_new_target")
  };
  }

   async function saveParameterKpi() {
  const parameterObjectId = getParameterFieldValue("parameter_object_id");
  const method = parameterObjectId ? "PUT" : "POST";

  const url = parameterObjectId
    ? '/api/responsibles/' + responsibleId + '/kpi-objects/' + parameterObjectId
    : '/api/responsibles/' + responsibleId + '/kpi-objects';

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildParameterPayload())
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.error("SAVE KPI OBJECT API ERROR:", errorData);
      showToast(errorData?.error || "Failed to save KPI object");
      return;
    }

    closeParameterModal();
    await loadParameterKpis();
    showToast(parameterObjectId ? "KPI Object updated" : "KPI Object created");
  } catch (error) {
    console.error("SAVE KPI OBJECT ERROR:", error);
    showToast("Failed to save: " + error.message);
  }
}

      async function deleteCurrentParameterKpi() {
        const parameterObjectId = getParameterFieldValue("parameter_object_id");
        if (!parameterObjectId) return;

        const ok = confirm("Delete this KPI object?");
        if (!ok) return;

        await deleteParameterKpi(parameterObjectId, true);
      }

      async function deleteParameterKpi(parameterObjectId, fromModal = false) {
        const ok = fromModal ? true : confirm("Delete this KPI object?");
        if (!ok) return;

        try {
          const res = await fetch('/api/responsibles/' + responsibleId + '/kpi-objects/' + parameterObjectId, {
            method: "DELETE"
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => null);
            showToast(errorData?.error || "Delete failed");
            return;
          }

          if (fromModal) closeParameterModal();
          await loadParameterKpis();
          showToast("KPI object deleted");
        } catch (error) {
          showToast("Delete failed");
        }
      }

      document.getElementById("search").addEventListener("input", (e) => {
        loadKpis(e.target.value);
      });

      document.getElementById("modalBackdrop").addEventListener("click", (e) => {
        if (e.target.id === "modalBackdrop") closeModal();
      });

      document.getElementById("parameterModalBackdrop").addEventListener("click", (e) => {
        if (e.target.id === "parameterModalBackdrop") closeParameterModal();
      });

      [
        "parameter_kpi_id",
        "parameter_kpi_type",
        "parameter_location",
        "parameter_local_currency",
        "parameter_value",
        "parameter_value_date",
        "parameter_target",
        "parameter_best_new_target"
      ].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener("input", updateParameterOverview);
          el.addEventListener("change", updateParameterOverview);
        }
      });

      const parameterKpiSelect = document.getElementById("parameter_kpi_id");
      if (parameterKpiSelect) {
        parameterKpiSelect.addEventListener("change", updateParameterKpiSummary);
      }

     bindOverviewListeners();
     const kpiTypeSelect = document.getElementById("parameter_kpi_type");
     if (kpiTypeSelect) kpiTypeSelect.addEventListener("change", handleKpiTypeChange);
     const plantSelect = document.getElementById("parameter_plant");
     if (plantSelect) plantSelect.addEventListener("change", handlePlantChange);
     bindHierarchyListeners();
     bindLimitListeners();
     resetParameterForm();
     loadKpis();
     loadParameterKpis();
    
