const fs = require('fs');
try {
  const items = JSON.parse(fs.readFileSync('spot-the-bot-data.json', 'utf-8'));
  
  const sectionOrder = ['abstract', 'intro', 'discussion'];
  
  const getTruthKind = (item) => {
    if (!item || !item.truth) return 'bot';
    return item.truth.kind || (item.truth.source === 'human' ? 'human' : 'bot');
  };

  const buildPaperGroups = (items) => {
    const paperById = new Map();

    items.forEach((item) => {
      if (!item.paper_id || !item.section || !item.truth) return;
      const paper = paperById.get(item.paper_id) || {
        paper_id: item.paper_id,
        paper_title: item.paper_title,
        display_title: item.display_title || item.title,
        journal: item.journal,
        year: item.year,
        logo_key: item.logo_key,
        humanBySection: {},
        botsBySection: {},
        eligibleSections: []
      };

      if (getTruthKind(item) === 'human') {
        paper.humanBySection[item.section] = item;
      } else {
        paper.botsBySection[item.section] = paper.botsBySection[item.section] || [];
        paper.botsBySection[item.section].push(item);
      }

      paperById.set(item.paper_id, paper);
    });

    const papers = Array.from(paperById.values()).map((paper) => {
      paper.eligibleSections = sectionOrder.filter((section) => {
        return paper.humanBySection[section] && paper.botsBySection[section]?.length;
      });
      return paper;
    }).filter((paper) => paper.eligibleSections.length);

    papers.sort((a, b) => a.paper_title.localeCompare(b.paper_title));
    return { paperById, papers };
  };

  const grouped = buildPaperGroups(items);
  console.log("Papers length:", grouped.papers.length);
  
  let usedPaperIds = new Set();
  const pickRandomItem = () => {
    if (!grouped.papers.length) return null;

    if (usedPaperIds.size >= grouped.papers.length) {
      usedPaperIds.clear();
    }

    const available = grouped.papers.filter((paper) => !usedPaperIds.has(paper.paper_id));
    const sample = (items) => items[Math.floor(Math.random() * items.length)];
    const paper = sample(available);
    usedPaperIds.add(paper.paper_id);

    const section = sample(paper.eligibleSections);
    const showBot = Math.random() < 0.5;
    if (showBot) {
      return sample(paper.botsBySection[section]);
    }
    return paper.humanBySection[section];
  };

  const current = pickRandomItem();
  if (!current) throw new Error('No playable items found');
  console.log("current item:", current.id);
  
} catch (error) {
  console.error(error);
}
