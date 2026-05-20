# Perturb-Seq: Dissecting Molecular Circuits with Scalable Single-Cell RNA Profiling of Pooled Genetic Screens

# Abstract

Genetic screens help infer gene function in mammalian cells, but it has remained difficult to assay complex phenotypes—such as transcriptional profiles—at scale. Here, we develop Perturb-seq, combining single-cell RNA sequencing (RNA-seq) and clustered regularly interspaced short palindromic repeats (CRISPR)-based perturbations to perform many such assays in a pool. We demonstrate Perturb-seq by analyzing 200,000 cells in immune cells and cell lines, focusing on transcription factors regulating the response of dendritic cells to lipopolysaccharide (LPS). Perturb-seq accurately identifies individual gene targets, gene signatures, and cell states affected by individual perturbations and their genetic interactions. We posit new functions for regulators of differentiation, the anti-viral response, and mitochondrial function during immune activation. By decomposing many high content measurements into the effects of perturbations, their interactions, and diverse cell metadata, Perturb-seq dramatically increases the scope of pooled genomic assays.

# Introduction

Genetic screens systematically analyze gene function in mammalian cells. Such screens are designed in either: (1) an individual ("arrayed") format, where each perturbation is delivered and assessed separately; or (2) a pooled format, performed en masse. Pooled readouts measure cell autonomous phenotypes, such as growth, drug resistance, or marker expression. Pooled screens are more efficient and scalable, but have been limited to low-content readouts. Distinguishing between different molecular mechanisms that yield similar phenotypes requires time and labor intensive follow-up.

Bridging the gap between rich profiles and pooled screens has been challenging. In mammalian cells, a few studies transcriptionally profiled hundreds of individual perturbations. In yeast, up to 1,500 knock out (KO) strains have been assessed. Even signature screens were only performed in centralized efforts.

Profiling may particularly help interpret the combined nonlinear effects of multiple factors. Comprehensive analysis of genetic interactions in growth phenotype between pairs of genes has been performed in yeast. In mammals, only small sets of pre-selected pairs have been assessed for cell viability or morphology. One yeast study determined the combined effects of regulators on expression profiles in a circuit of three to five genes. Very few studies have examined higher order interactions and none have coupled those with a high content scalable readout.

To address this challenge, we develop Perturb-seq, combining the modularity of clustered regularly interspaced short palindromic repeats (CRISPR)/Cas9 to perform multi-locus gene perturbation with the scale of massively parallel single cell RNA sequencing (scRNA-seq) as a rich genomic readout. We demonstrate Perturb-seq in primary post-mitotic immune cells and in proliferating cell lines. We develop a computational framework, Multi-Input-Multi-Output-Single-Cell-Analysis (MIMOSCA), to decipher the effect of individual perturbations and the marginal contributions of genetic interactions on the level of each transcript, program, and cell state. Our framework can be extended to other high dimensional molecular phenotypes or diverse cell metadata.

# Main

## Perturb-Seq: Pooled, Combinatorial CRISPR Screens with scRNA-Seq Readout

We developed Perturb-seq to combine a pooled CRISPR screen with scRNA-seq by encoding the identity of the perturbation on an expressed guide barcode (GBC). We first infect cells with a pool of lentiviral constructs that encode single-guide RNAs (sgRNAs). Here, we designed and used a CRISPR lentiviral vector that both delivers an sgRNA to a cell and reports on the identity of the sgRNA by an expressed GBC. By varying the multiplicity of infection (MOI), we tune the screen to study single gene or epistatic effects. Cells are grown, differentiated, and/or stimulated, followed by scRNA-seq. scRNA-seq, performed in a single pool, tags each cell's mRNA, including the GBC, with a unique cell barcode (CBC) and a unique molecular identifier (UMI). The CBC associates the cell's transcriptional profile with the delivered genetic perturbation(s), encoded by the GBC. Here, we use CRISPR/Cas9 in the KO context.

We performed six Perturb-seq experiments, analyzing 200,000 cells. In bone marrow-derived dendritic cells (BMDCs), we targeted 24 transcription factors (TFs) and measured the effects pre-stimulation (0 hr) and at 3 hr post-lipopolysaccharide (LPS). In K562 cells, we targeted 14 TFs and 10 cell-cycle regulators in separate pooled experiments. For K562 TFs, we performed experiments using lower and higher MOI and at two time points. We collected reference scRNA-seq data from unperturbed cells separately.

## Perturb-Seq Detection of GBCs and On-Target Knockdown

We developed an optimized enrichment protocol to detect the GBCs. We associated each sgRNA with its corresponding GBC by sequencing and converted the plasmids into lentivirus for pooled transduction. The plasmid construct included an ORF encoding a Puromycin-T2A-BFP, allowing us to select for transduced cells by fluorescence-activated cell sorting (FACS) or by antibiotics. Finally, we designed a PCR protocol to enrich for the GBC following whole transcriptome application (WTA). In some cases, we observed more than one GBC in a cell. To distinguish between those arising from multiple infections and those due to PCR chimeras or ambient RNA, we filter low-abundance contaminants by normalizing the observed GBCs within each CBC and retain cells with more than one GBC for epistasis analysis. Most of these are not doublets, given their higher frequency than expected by our cell yield and their comparable number of genes versus single GBC cells.

We estimated the probability of GBC detection and MOI by assuming a zero-truncated Poisson distribution (due to BFP + selection), convolved with a binomial process (for the probability of detection). The predicted fit was indistinguishable from the observed frequencies of number of guides per cell. We had a 94% detection probability with an initial MOI of 0.63 in the K562 TF pool, a 98% probability with an MOI of 0.35 in the cell-cycle pool, and a 60% detection probability with an MOI of 1.4 in BMDCs at 3 hr. The lower detection in BMDCs is due to the lower complexity of these smaller cells' profiles and increases to 70% after filtering cells with the lowest complexity. Rather than apply an arbitrary filter, we address the detection rate in our analysis.

For most of the guides, there is a significant reduction in the expression of the targeted gene. The ability to determine a reduction is affected by the target's expression level in wildtype (WT) cells, the cell's capture efficiency, and incomplete nonsense-mediated decay of frameshifted transcripts.

## A Computational Model to Stratify Transcriptional Effects of Single-Cell Perturbations

We devised a computational framework (MIMOSCA) based on a regularized linear model, to estimate the impact of perturbations on gene expression. In simplest form, the model predicts each gene's (log) expression level as a linear combination of the effects of guides, fitting the regulatory effect of each guide on each gene. We do not use information on which gene each guide targets or which guides target the same gene. We fit the coefficient matrix with elastic net regularization, to reduce the number of hypotheses tested, and to address correlated covariates and noisy data. We evaluate the significance of the each coefficient with a permutation-based test.

Next, we use the framework to account for technical covariates. We account for the number of observed transcripts in a cell (cell quality) by including them as covariates in the model. We also address the probability that a perturbation successfully affected the cell, distinguishing cells that did not have a successful perturbation, as often observed in CRISPR experiments. To this end, we use the initial regulatory matrix fit by the model as a first assessment of the perturbations' effects. We revisit each cell and evaluate the extent to which its profile was consistent with the assigned perturbation. Finally, we re-estimate the model with a corrected perturbation-to-cell assignment. Based on the estimated fit, over 66% of cells are affected by their delivered perturbation, on average. While filtering significantly improves the model fit, we did observe consistent, albeit dampened, effects without this procedure.

We also consider biological covariates of distinct cell subtypes or states. We classify profiles using the matched, genetically unperturbed, experiments and incorporate the predicted classifications of each cell as covariates. We fit the model either with or without cell-state covariates. Cell states explain a significant proportion of observed variation, and some of the sgRNAs' effects are accounted for, suggesting that those perturbations may have primarily affected subtype proportions.

We can incorporate nonlinear interactions in our framework, by adding interaction terms between covariates, such as genetic interactions between perturbations or interactions between perturbations and cell states. Here, we do this for genetic interactions.

## The Linear Model Is Robust, Reproducible, and Predictive

We determined the proportion of the variance in the data explained by each of the three components of the model. For stimulated BMDCs, the perturbations explain 5% of the variance, 17% is explained when adding cell quality covariates, and up to 20% with added cell-state covariates. We obtain similar results with the other datasets. Gene-gene correlations in the residuals were also significantly reduced as we added covariates. We note that guides targeting genes have stronger and more consistent effects than a control guide.

## Perturb-Seq Dissects the Transcriptional Program in the BMDC Response to LPS

To show how Perturb-seq recovers the correct genes, processes, and states regulated by TFs, we analyzed the effect of 24 TFs in BMDCs. Approximately 2,000 genes are induced in this response through the action of dozens of TFs. The response is not fully synchronous, and moreover, cells may consist of at least two sub-types whose function is not fully elucidated.

We cultured precursors from the bone marrow of Cas9 transgenic mice in GM-CSF, and after 2 days, infected them with a lentiviral pool targeting 24 TFs (67 guides) and a non-targeting control. After another 7 days, we stimulated the cells with LPS and collected cells for scRNAseq at 0 and 3 hr (32,624 and 37,369 cells, respectively). Perturbations did not strongly affect fitness or the number of transcripts/cell. Pilot experiments validated our sensitivity (80%) and specificity (90%) to detect—with approximately 100 single cells/guide—the correct genes regulated by the perturbation compared to bulk RNA-seq following the same perturbation.

A simple model for stimulated BMDCs performed well by two basic measures: guides targeting the same gene had a similar impact, with correlated regulatory coefficients profiles, and guides typically repressed their direct target.

Next, we used the regulatory effects of each perturbed TF on each gene, to group TFs into modules by their similar regulatory effects and to group genes into programs by how they are affected by the perturbations. There were four TF modules (M1-M4): (M1) the anti-viral TFs Stat1 and Stat2; (M2) the pioneer factor Cebpb, with JunB, Rela, Stat3, and Hif1; (M3) Rel, Irf2, and Atf3; and (M4) the pioneer factor Spi1/Pu.1, with Runx1, Irf4, and Nfkb1. There were five gene programs, each enriched for distinct processes (P1-P5): (P1) an anti-viral response; (P2) antigen presentation, cytoskeleton, and ribosomal proteins (RP); (P3) mitochondrial function and biogenesis; (P4) an interferon gamma response to intracellular pathogens; and (P5) an inflammatory TNF response.

The TF modules regulate programs consistent with known functions. For example, Stat1 and Stat2 (M1) are known activators of the anti-viral program (P1). The predicted repression of the antiviral program by M2 is supported by studies that Atf3 is a transcriptional repressor of interferon beta and the anti-viral response. Our prediction that Stat1 and Stat2 are repressors of mitochondrial biogenesis (P3) is supported by Stat1's inhibition of mitochondrial biogenesis in mouse liver and Stat2 mutations in children with mitochondrial disorders.

The model predicts the details of regulation of the anti-parasitic response genes Gbp2, Gbp2b, Gbp3, Gbp4, Gbp5, and Gbp7. These are all positively regulated by Stat1 and Stat2 and negatively regulated by Rel and Irf2, consistent with studies on Stat1 and Rel. Our model also predicts that Stat2 activates Irf8—a key TF that controls GBP expression, suggesting that Stat2's impact on GBPs may be mediated through Irf8. Conversely, Batf is induced by Stat2 perturbation, a possible compensation.

## Opposing Programs of BMDC Differentiation Controlled by Two Modules Wired by Positive and Negative Feedback Loops

Further analysis shows that Module M2 and M4 have opposite effects on the proportion of cells in two mutually exclusive cell states, reflected by programs P2 and P4/5. These correspond to alternative cell differentiation or maturity types. The opposing functions are wired through multiple positive and negative loops, such that perturbing the module controlling one subtype switches the cells to the other.

Specifically, modules M2 and M4 had opposite effects on P2 (repressed by M2 and induced by M4) and P4 and P5 (induced by M2 and repressed by M4). P4 and P5 reflect key aspects of the response to LPS and pathogens. P2 is enriched for genes for antigen presentation, cytoskeleton proteins, and RPs, and includes key genes associated with distinct cell identity, especially SerpinB6 and CD86. Ribosomal, cytoskeletal, and MHC II proteins are induced in pre-DCs, and several pre-DCs and late-pre-DC genes are members of P2 (e.g., lglas3, Itgax, Crip1, Cd74, H2-Ab1, H2-AA, H2-Eb1), as are Il12, Id2, Irf8, and Cd24a (whereas Zeb2 and Sirpa are in P4). Thus, P2 may reflect a distinct cell state or type, either less differentiated or abortive ex vivo.

We hypothesized that the regulatory effects on P2 and P4/5 reflect the impact of the perturbed TFs on the distribution of cells across possible BMDC subtypes. To test this, we identified seven cell clusters in 1,310 wild-type LPS-stimulated cells. The clusters are significantly associated with the induction of genes from the five programs. Thus, induction of P2 and P4/5 represent different BMDC states, which are present even when the cells are not genetically perturbed. Testing the association of each guide or targeted gene with each state, cells perturbed for M2 TFs (Cebpb, Rela, JunB) are enriched in clusters matching P2 and depleted in clusters matching P5, whereas those perturbed for M4 TFs (Spi1, Irf4, Nfkb1, Runx1) have the opposite effect.

Thus, M2 and M4—with their distinct pioneer factors Cebpb and Spi1, respectively—have mutually opposing effects: M2 may promote differentiation, leading to LPS-responsive programs (P4 and P5), whereas M4 promotes a mutually exclusive state that is either less differentiated or less productive ex vivo (P2). Both states are present in different cells absent genetic perturbation; the perturbations shift their proportions. The two TF modules are present and have the same effect even prior to LPS stimulation.

Our modules self-reinforce and mutually inhibit to balance the programs. First, P2 and P5 include as member genes their key positive and negative regulators: Irf4 from M4 is a member of P2 (positive feedback), whereas Stat3 from M2 is also in P2 (negative feedback); Cebpb and Hif1a of M2 are members of P5 (positive feedback), but so is Spi1 of M4 (negative feedback). Similarly, in the antiviral program (P1), Stat1 of M1 is a member (positive feedback), but so are Irf2 and Atf3 of M3 (negative feedback). Moreover, based on the significant transcriptional effects of the perturbed TFs on each other, most of the TF modules have internally reinforcing activation (e.g., Hif1a and Cebpb by each other and by JunB, Stat3, Rela [M2]; Stat1 by Stat2 [M1]; Irf4 by Nfkb1 and Runx1 [M4]), and repression between modules (e.g., Cebpb and Hif1a in M2 repressed by Runx1 and Nfkb1 in M4; Rela in M2 repress Irf4 in M4; Stat3 and Rela in M2 repress Rel in M3).

## The Genetic Circuit Is Supported by TF Binding Profiles

The targets our model predicted for most TFs are strongly supported by chromatin immunoprecipitation sequencing (ChIP-seq) data of the genes bound by these TFs in bulk populations. For example, targets bound in either unstimulated or stimulated cells by the constitutively bound, activating TFs Rela and Cebpb are downregulated when these TFs are perturbed. Targets bound at 2 hr post-LPS by the dynamically bound activators Stat1 and Stat2 are downregulated in perturbed BMDCs post-stimulation.

The model also correctly predicted the targets and logic of repressors, such as Irf2, Atf3, and Nfkb1. Perturbing Irf2 affects its bound targets both pre- and post-stimulation, consistent with its role as a repressor pre-bound pre-LPS. The targets bound by Atf3 and preferentially induced by its perturbation are enriched for anti-viral genes, supporting it as a repressor of the antiviral response. Nfkb1 (encoding p50) is predicted by the model to act as a repressor for its bound targets, suggesting that its perturbation affected a p50-p50 repressor homodimer, more than a p50-p65(Rela) activator heterodimer post LPS.

The TF binding patterns also support their direct regulation of P1, P4, and P5. Genes bound by M1 TFs are enriched in P1 and P4 (positively regulated by M1); genes bound by the repressors Atf3 and Irf2 (M3) are enriched in P1 (negatively regulated by M3); genes bound by Atf3 are also enriched in P4 (including IL-6); Stat3- and Rela- (M2) bound genes are enriched in P4, and Cebpb bound genes are enriched in P5 (both positively regulated by M2). Bound targets of M4 TFs (Irf4, Runx1, Nfkb1) are enriched in P4, and Nfkb1 targets are also weakly enriched in its repressed target program P5. The remaining two programs do not show such enrichments for bound TF targets, for example, suggesting that Stat1 and Stat2 regulate P2 indirectly, perhaps through mitochondrial signaling.

## TF-Specific Programs Revealed Once Accounting for Global Effects

Global effects on cell states may mask other specific effects of a TF within cells in a given state. To recover those, we added the assignment of the perturbed cells into the seven states as covariates. Following this, guides targeting the same TF grouped particularly tightly. For example, the model showed that MHCII genes are positively regulated by Runx1 and Ctcf and negatively regulated by Rel and a strong repression of the IFN gamma response by Irf2. The two models are complementary: one emphasized global effects; the other uncovers TF-specific effects.

## Genetic Interactions Affect Gene Expression and Global Cell States

To dissect how the effects of multiple TFs combine, we analyzed cells containing more than one guide after strict filtering of GBCs. First, in many cases pairs, and even triplets of TFs affected in a non-additive way the probability that a cell assumes one of the seven cell states. For example, cells containing GBCs for all three of Maff, Rel, and Stat2 have a lower probability of being in cell-state 3 than expected by their individual and pairwise effects.

Next, we assessed the effect of genetic interactions on the expression of each gene using our model with interaction terms. For each pair of perturbed TFs, we assessed the relative proportion of target genes where their relation is additive (no interaction), synergistic, buffering (antagonistic), or dominant (when the two factors have opposing effects and the interaction term enhances one of them). Most TF pairs involving one of Runx1, Irf1, Irf2, or Irf4 had mostly additive effects, whereas pairs with combinations of Stat1, Stat2, Stat3, Rela, Nfkb1, and Spi1 were enriched for interactions. Only those involving Nfkb1 (Stat1-Nfkb1, Stat3-Nfkb1, Rela-Nfkb1, Spi1-Nfkb1) were enriched for buffering interactions.

Finally, we related the different categories of interactions to TF binding, illustrated for Nfkb1 and Rela. Individually, Nfkb1 and Rela have opposing effects on the genes in P4 and P5: Nfkb1 as a repressor and Rela as an activator. These target genes are partitioned in two by the model with genetic interaction: in one subset, the joint perturbation of Rela and Nfkb1 is additive (no interaction), whereas in the other there is a dominant interaction (of Nfkb1 over Rela). Both sets belong to the same programs and both are enriched for ChIP targets of both Nfkb1 and Rela, but only the set with the dominant interaction is enriched for co-binding. Similar cases, where genetic interactions are present only when the two factors are co-bound, are found for additional pairs (e.g., Runx1-Rel, Irf4-Nfkb1).

## Global Transcriptional Modules and Specific TF Effects in K562 Cells

To test the generality of our approach, we performed Perturb-seq targeting ten TFs in K562 cells, a rapidly proliferating cell line. Fitting a linear model without cell-state covariates, the TFs partition into two modules. Guides to the same gene were correlated in their effects, both within and across experiments of different durations.

We defined nine cell states by clustering of WT cells and found specific perturbations enriched in individual states, consistent with known functions of the perturbed genes. For example, cells perturbed in EGR1 are depleted from cell-state 6, which has an increased expression of hemoglobin biosynthesis genes, consistent with EGR1's known role. Cells perturbed in YY1 are enriched in state 5 (induction of cholesterol biosynthesis genes), consistent with its known role as a repressor of this process.

Next, we fitted a model that accounted for cell states. Because these states are likely continuous (e.g., cell-cycle phase) rather than discrete types, we performed PCA on WT K562 cells, scored the cells from the Perturb-seq experiment against those PC scores, and introduced the state PC scores as covariates. In the resulting model, individual guides to the same gene are more consistent in their effects, especially across experiments and durations, suggesting that TF-specific effects are reproducible even if cell-state proportions change over time.

The model correctly predicts individual TF functions. For example, GABPA perturbation represses mitochondrial functions, consistent with its known role. YY1 perturbation is correctly predicted to represses oxidative phosphorylation and induce an innate immune response and is enriched for its ChIP-seq targets.

## Perturbations of Cell-Cycle Regulators Reveal Distinct Profiles Associated with Similar Fitness Effects and Mitotic Arrest

Individual cells in a rapidly dividing cell line vary in their cell-cycle state, readily observed by scRNA-seq. Cell-cycle phenotypes can be screened by morphology or markers, but two genes with the same phenotypic effect may act through different mechanisms. To address this, we targeted in K562 cells 13 genes (33 guides) that were previously identified by a mitotic arrest phenotype in a genome-wide imaging screen in HeLa cells.

Determining the fitness effects of each perturbation, we found a strong proliferative advantage conferred by perturbing PTGER2, CABP7, and CIT, and a disadvantage when perturbing AURKA, TOR1AIP1, and RACGAP1. (Among K562 TFs, perturbing EGR1 had a disadvantage.) Furthermore, supervised analysis using signature gene sets for cell-cycle phases showed that perturbations of AURKA and TOR1AIP1 (both decrease fitness) are associated with an increase in G2/M and M signatures. Perturbation of CABP7 (increases fitness) has an opposite effect: decrease in G2/M and M signatures and increase in the M/G1 signature. Perturbation of CIT increases G1/S and S states, a different cell-cycle route manifested as increased fitness.

Our model shows that distinct processes are affected by factors with positive and negative fitness effects, and highlights two different routes underlying increased fitness. Perturbation of CABP7 strongly induced a program of mitochondrial respiration and biogenesis, nuclear factor kappa B (NF-kappa B) signaling, and mitotic division, consistent with the fitness advantage. Perturbation of CIT and PTGER2 (also increased fitness) repressed these programs but induced the expression of other genes, especially 11 histone genes induced by CIT. The overall partitioning of factors by their regulatory effects mostly followed their groupings by morphology in HeLa cells: (1) CIT, PTGER2, and RACGAP1 (binuclear phenotype); (2) CENPE and ARHGEF17 (grape-like phenotype and mitotic delay); and (3) Aurora kinases A, B, and C (proliferation and migration defects). An exception is CABP7, which, despite a similar binuclear phenotype to that of CIT, PTGER2, and RACGAP1, has a distinct transcriptional phenotype.

## A Guide to the Miserly: Effects on Gene Signatures Are Robust to Downsampling of Cells and Reads

The regulatory coefficients associated with our perturbations are highly structured, with sets of targets similarly affected across sets of perturbations, consistent with modular gene regulation. Thus, it should be possible to recover effects on gene signatures—e.g., guides that affect the antiviral response—even with low numbers of cells and reads.

We quantified our ability to detect gene level regulation versus signature or state level regulation (data-driven clusters or known gene sets), when we down-sample cells and reads/cell. The number of cells and reads required for signature level effects is lower than that needed to detect effects on individual genes (10's versus 100-200 cells/perturbation; 400 versus 1,000 transcripts). These estimates provide helpful guidelines for future Perturb-seq applications.

To support the feasibility of large Perturb-seq screens, we also demonstrated that all steps in Perturb-seq could be performed in a single pool. We synthesized an array of sgRNAs targeting seven chromatin regulators and five intergenic controls and performed pooled cloning, virus preparation, transduction, cell growth, scRNA-seq (14,000 cells), and model fitting. Guides to the same gene agreed well. Early pooling may cause recombination in lentivirus but allows large screens with appropriate strategies.

# Discussion

We developed Perturb-seq, a method to analyze the transcriptional effect associated with genetic manipulations on genes, processes, and states. Perturb-seq decreases the time and cost associated with assaying the complex effects of large numbers of perturbations, including combinations.

## Future Enhancements of Precision and Facility

An important advantage of using Perturb-seq is that higher order interactions can be assayed without further need to generate complex reagents. Due to the Poisson loading of perturbation per cell, the same experiment used for a single perturbation can also uncover the genetic interactions between the perturbed genes. Future work could leverage the ability of Cpf1 to autonomously process an entire array and deliver several sgRNAs (or an unprocessed array) on one construct.

## Current and Future Scale of Perturb-Seq

At its current scale, Perturb-seq can be readily applied for targeted screens of a subset of genes of interest and their interactions, as we have done here. In some systems, growth or marker-based screens may first be performed to identify this subset prior to Perturb-seq. Perturb-seq will scale as both the cost of sequencing and of scRNA-seq decreases.

By varying the number of surveyed cells and the sequencing depth, screens can be adjusted to focus on cell states and signatures or on effects on individual genes. Our analysis suggests that a broad survey of transcriptional phenotypes across thousands of perturbations can be performed with a few tens of cells per perturbation.

Genome-wide or large combinatorial screens will also require increased computational bandwidth. MIMOSCA is designed foreseeing screens with millions of cells, with fast, scalable, and parallelizable algorithms. It is publically available with worked examples.

## Challenges and Opportunities for Understanding the Vast Space of Possible Genetic Interactions

As we showed, Perturb-seq can in principle dissect higher order effects, but systematic analysis of genetic interactions remains an ambitious goal. First, both the probability of detecting all perturbations and the probability of all perturbations resulting in an effect scale exponentially with the order of perturbations. Our inference framework and future improvements can help deconvolve mixtures of knockouts, and is potentially scalable to higher order interactions. However, while Perturb-seq significantly reduces time and cost, these still scale linearly with the number of perturbations assayed, whereas the size of combination space grows exponentially as the order of combinations grows.

We hypothesize that a plausible alternative strategy exists, combining substantial under-sampling of this vast space with appropriate analytics that make inference possible even when the number of possible combinations is much larger than the number of samples. We are motivated by two biological assumptions: (1) modularity, as we have shown for both the perturbations and the gene targets; and (2) sparsity, such that the majority of gene pairs (or higher order combinations) do not manifest genetic interactions. If sparsity holds for expression phenotypes, a subset of experiments can be performed in which most cells receive a relatively large number of perturbations (e.g., five), and we infer both partially observed and even entirely unobserved interactions at a lower order effects (e.g., two or three). Perturb-seq was designed bearing in mind such future studies, which will leverage group structure in perturbations and their interactions.

## A General Framework to Combine Rich Readout with Cellular Metadata

Other CRISPR-based perturbations are readily compatible with Perturb-seq, including CRISPRi as in our companion study, CRISPRa, and alternative editors (e.g., Cpf1). Expressed barcodes can also be used to mark cells derived from a common ancestor for the purposes of lineage tracing. Other measurement platforms, such as multiplex PCR or multiplex protein measurements can help focus on a subset of target transcripts or proteins, respectively. It should also be possible to apply Perturb-seq in vivo, or in co-cultures of perturbed cells in droplets, merging them with scRNA-seq.

We hope that the experiments and analysis provided here and in Adamson et al. will be starting points for future experiments that combine scRNA-seq and pooled screens. These will bridge the gap between genetic screening and molecular follow-up experiments and will facilitate causal studies of how specific genotypes lead to phenotypes.

# Methods

## Cas9 transgenic mouse

For all BMDC experiments, we derived cells from six- to eight-week old constitutive Cas9-expressing female mice, from the transgenic mice we described previously, and that are also available from the Jackson labs. All animal protocols were reviewed and approved by the MIT / Whitehead Institute / Broad Institute Committee on Animal Care and all experiments conformed to the relevant regulatory standards.

## Bone marrow derived dendritic cells

To obtain a sufficient number of cells, we implemented a modified version of the DCs isolation protocol as previously described. RPMI medium (Invitrogen) supplemented with 10% heat inactivated FBS (Invitrogen), beta-mercaptoethanol, L-glutamine, penicillin/streptomycin, MEM non-essential amino acids, HEPES, sodium pyruvate, and GM-CSF was used throughout the study. At day 0, cells were collected from femora and tibiae and plated in 100mm non tissue culture treated plastic dishes. At day 2, cells were fed with another 10ml of medium per dish. At day 5, 12ml of the medium were carefully removed and 10ml of fresh medium were added back to the original dish. Cells were fed with another 5ml medium at day 7. At day 8, all non-adherent and loosely bound cells were collected and harvested by centrifugation. Cells were then re-suspended with medium, plated at a concentration of 10x10^6 cells in 10ml medium per 100mm dish. At day 9, cells were stimulated with LPS and harvested. Cells were harvested post stimulation after 0hr or 3hr and cells from cultures that contained 10% BFP positive cells were sorted for BFP+ and GFP+ (contain CAS9).

## K562 cell cultures

We used transgenic K562 cells constitutively expressing Cas9. K562 cells were transduced using several titers of virus and cells were spin infected in 2,000 rpm for 30 min. For the low MOI experiment, we used cultures that contained 10% BFP+ and for the high MOI 50% BFP+. Cells were grown in RPMI medium 1640 + GlutaMAX (ThermoFisher) + 10% heat inactivated FBS (Invitrogen). Cells were grown to a confluence of 30%-60% and spun down at 300x g for 5 min. The supernatant was removed, and cells were suspended in 5 mL of 1x PBS + 0.2% BSA for sorting: BFP+ and GFP+ (CAS9 expressing) cells were sorted. Cells were harvested for library preparation 7 days post transduction for most experiments and 13 days post transduction for the second time point of the TF pool experiment.

After sorting, BFP+ GFP+ cells were passed through a 40-micron cell strainer, washed twice, and counted.

## Construction of lentivirus-vector and transduction

A lentivirus backbone was constructed containing: antiparallel cassettes of a mouse U6 promoter for sgRNA and EF1 alpha promoter for expression of puromycin, BFP and a polyadenylated GBC cassette. The vector was digested using BlpI and BstXI and annealed oligonucleotides, encoding sgRNAs, were ligated in an arrayed format. Association between GBCs and sgRNAs was determined using Sanger sequencing to generate a sgRNA/GBC dictionary. sgRNAs for BMDCs were designed using published methods for BMDCs and the K562 guides were from a published library design. Plasmids were pooled together prior to lentivirus preparation.

## Cloning of array-synthesized guide pools

We also devised, for proof-of-concept experiments, a two-step cloning procedure to perform cloning in a pool followed by next generation sequencing to create the sgRNA/GBC dictionary.

## Vector backbone compatible with pooled cloning

We assembled pPS, a lentiviral vector similar to the one described above containing antiparallel cassettes of a human U6 promoter for sgRNA expression and a cloning site for high-diversity library of GBCs. However, in place of the EF1 alpha -Puro-T2A-BFP cassette, we inserted a NotI site so the sgRNA and its GBC are sufficiently close to be associated through next generation sequencing.

## sgRNA library cloning

We synthesized an oligo pool corresponding to several sgRNA libraries with PCR tags. We enriched for the desired sub-pool of oligonucleotides by PCR using sub-pool-specific primers and purified the product using a 2x volume of AMPure XP SPRI beads. We then added homology arms for Gibson assembly by performing PCR with primers GuidePool Fwd/Rev and purified the product with 1x SPRI beads.

We prepared the vector backbone by digesting sgPS with BsmBI (New England Biolabs (NEB), Ipswich, MA) followed by purification with 0.75 AMPure XP SPRI beads. We assembled 70 ng amplified library into 500 ng digested vector in a 50 micro-L Gibson reaction (NEB), cleaned it with 0.75 AMPure XP SPRI, eluted in 15 micro-L H2O and electroporated the entire volume into Endura competent cells (Lucigen, Middleton, WI). We expanded the cells in liquid culture for 18 hr at 30 C.

## Next generation sequencing to create sgRNA/GBC dictionary

We generated a paired-end Illumina sequencing library, where read1 corresponded to the sgRNA and read2 corresponded to the GBC by amplifying the intermediate plasmid pool with custom PCR primers containing Illumina sequencing adaptors, and sequenced them to an average depth of > 100 reads per GBC with an Illumina MiSeq.

## Insertion of EF1 alpha -Puro-T2A-BFP cassette

We amplified the EF1 alpha -Puro-T2A-BFP cassette from the vector described above by PCR with primers to add Gibson arms compatible for cloning into the NotI-digested intermediate pool. We assembled 300 ng of the amplified cassette into 300 ng of a digested intermediate pool in a 20 micro-L Gibson reaction (NEB), cleaned it with 0.75 AMPure XP SPRI, eluted in 15 micro-L H2O and electroporated the entire volume into Endura competent cells (Lucigen). We expanded the cells in liquid culture. Lentivirus was made using 293T cells transfected with perturb-seq vector (pBA439 or pPS), psPAX2, and pMD2.G at a 10:10:1 ratio, using Lipofectamine LTX and additional reagents according to the manufacturer's instructions.

## Single cell library preparation

In our current implementation, we rely on a droplet method, which is now commercially available, but our design is compatible with additional single-cell RNA-seq methods, and we have tested it successfully with Drop-Seq in both K562 cells and BMDCs.

Prior to analysis, cells were diluted to the final concentration in 1x PBS + 200 micro-g/mL BSA (NEB). Sorted cells (BMDCs or K562 cells) were loaded on the 10X Chromium system (8,000 cells/channel) and single cell RNA-seq libraries were generated following the manufacturer's instructions.

Following WTA, a fraction of the WTA was used to amplify GBCs using a dial-out PCR strategy. The template material was approximately 5ng of WTA libraries. 25 cycles of PCR were performed using one of the dial-out primers with the P7 Illumina reverse primer.

## Read alignment and generation of expression matrix

A digital expression matrix was obtained for each experiment using 10X's CellRanger pipeline with default parameters. Their pipeline uses STAR for alignment.

## Alignment of cell barcode / GBC libraries

To associate cell barcodes with guides, we used the sgRNA/GBC dictionary generated by either Sanger sequencing or NGS. Paired-end reads containing a cell barcode and UMIs on one side and GBC barcode on the other side were isolated and collapsed into unique molecules.

## Fit of distribution of guides per cell

We simultaneously fit a generative model of the number of guides per cell and the detection probability of observing a guide if a cell contains it using a maximum likelihood approach.

To approximate our probability of GBC detection, we considered two factors: (1) the initial MOI and (2) the technical transcript capture efficiency of the library preparation protocol. A third factor, the fitness effects of each of the guides, was not considered. We reasoned that for both our BMDCs TFs and K562 TFs pools our guides generally did not have strong fitness effects since their final representation correlated strongly with their initial abundance. While fitness effects due to having multiple guides can create a skewed distribution, we noted a consistent distribution between the two time points in our K562 TF pool.

## Determination of on-target effect

To assess the extent to which our observed reduction in on-target expression was significant, we performed a one-sample t test to determine if the mean of our observed data was significantly less than zero. We also permuted the assignments between GBCs and cells and obtained a distribution of permuted means and compared to our observed means from which we calculated a permutation p value.

## Linear model

To fit the linear model we compiled our covariate matrix X and our expression matrix (or one of the continuous covariates; as done for some assignments of cell states) as our matrix Y. We fit our model using an elastic net regularization through the Python implementation.

## Alternating descent fit of perturbation probability

To account for the contribution of unperturbed cells in the population containing a particular sgRNA, we constructed an approach in which the presence of sgRNA in a given cell was converted into a probability measure of that sgRNA having a phenotypic effect on the cell. We note that by Bayes' rule, the probability of being in a particular class of a two class outcome can be written as a logistic transform of the log likelihood.

## Significance testing for coefficients of linear model

We devised a permutation strategy to empirically obtain a null distribution of the coefficients associated with our sgRNA effects. Specifically, we randomized the guide assignments to cells (such that co-occurrence between guides was preserved) and the linear model was recomputed with all other covariates being held constant. We noticed that three significant as-yet latent factors impacted the empirical null distribution of coefficients: (1) the mean expression level of a gene; (2) the variance in expression of a gene; and (3) the number of cells a particular sgRNA was present in.

## Residuals analysis

To determine the marginal effect of each covariate in explaining the observed gene expression variation, we estimated the model R-squared by cross-validated for the addition of each of the covariates.

To determine the extent to which our covariates explained the major axes of variation in our data, we decomposed the residuals using the same randomized PCA approach.

## Cross validated R-squared

To estimate the generalizability of the model, we determined a cross-validated R-squared by training our model on 80% of our data and determining the fit on the remaining 20%.

## Definition of cell states

Cell states were defined using parallel experiments with cells without any introduction of sgRNAs. Starting from an expression matrix Y, variable genes were selected based on fitting a nonparametric Loess regression to the relationship between the average expression of a gene and its respective coefficient of variation (after normalizing each cell for complexity). Genes with high residuals were selected.

Next, the expression matrix was normalized per cell, log2 transformed with a pseudocount of 1 and the genes were Z-transformed. Randomized PCA was performed on the Z transformed expression matrix using randomized PCA.

Clustering was performed using Infomap with k refined so that slightly more clusters are created than one would expect. Clusters are subsequently merged in an iterative fashion such that no pairwise comparisons between clusters have fewer than 100 differentially expressed genes.

## Relation of perturbed cells to unperturbed states

To define the relationship between the cell states in the unperturbed cells and the perturbed cells, we projected the perturbed cells onto the same significant principal component vectors derived from the unperturbed cells. The projection onto these components was used as a covariate by itself, especially with K562 cells, where the major axes of variation, such as cell cycle, describe more continuous processes. For BMDCs, discrete cell types are readily discernable. There, we trained a random forest classifier using class labels obtained by the merged Infomap clusters with features consisting of PC scores.

## Tests of sgRNA effect on outputs other than gene expression

To evaluate the effect of an sgRNA on an output such as number genes detected, transcripts detected, or cell state, our regression framework is modified to predict these outputs instead of gene expression. The major modification is that the L1 sparsity-inducing penalty is removed, resulting in ridge regression.

## Fitness effects of sgRNAs

To assess the fitness effects of sgRNAs we obtained estimates of the initial abundances of each sgRNA in the pool, by NGS of the GBC. The GBC / sgRNA dictionary was used to convert the readout into a relative abundance estimate of sgRNA in the initial pool. Then, we calculated the fold change of the observed abundance of cells containing a particular sgRNA compared to its respective abundance in the original pool.

## Analysis of perturbation effects on individual genes and gene modules

The most variable genes from each Perturb-Seq experiment were filtered by using the jackstraw approach to identify the most significant genes in the top 20 PCs of the coefficient matrix. The genes were then clustered using k-means clustering by their coefficients. Gene ontology (GO) enrichment analysis was performed on each cluster.

## Comparison to ChIP-seq binding profiles

We analyzed assignments of TF binding in gene promoters in BMDCs following LPS stimulation across four time points (0, 30, 60, and 120 min). We used two tests for significant binding. First, the regulatory coefficients of bound genes were compared to those of unbound genes using a non-parametric Mann-Whitney test to identify significantly different means. Second, because TFs could both activate and repress genes, we examined the number of bound genes significantly up- or downregulated.

## Power analysis and experimental design considerations

Power analysis was performed to determine how many cells are required to observe a signal as a function of observed effect size and baseline expression of a gene. As an estimate of required read depth, we downsampled at the UMI level. We performed our regression analysis on the downsampled expression matrix for various amounts of downsampling and recomputed the resulting regulatory matrix.
