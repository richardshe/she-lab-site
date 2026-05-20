const fs = require('fs');
const items = JSON.parse(fs.readFileSync('spot-the-bot-data.json', 'utf-8'));
const getTruthKind = (item) => {
    if (!item || !item.truth) return 'bot';
    return item.truth.kind || (item.truth.source === 'human' ? 'human' : 'bot');
};
const paperById = new Map();
items.forEach((item) => {
    if (!item.paper_id || !item.section || !item.truth) return;
    const paper = paperById.get(item.paper_id) || {
        paper_id: item.paper_id,
        humanBySection: {},
        botsBySection: {},
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
    paper.eligibleSections = ['abstract', 'intro', 'discussion'].filter((section) => {
        return paper.humanBySection[section] && paper.botsBySection[section]?.length;
    });
    return paper;
}).filter((paper) => paper.eligibleSections.length);
console.log("Total eligible papers:", papers.length);
