const fs = require('fs');
const path = require('path');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const questsDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'quests', 'json');
const outputDir = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'docs', 'images');
const outputFile = path.join(outputDir, 'quest-tree-stats.png');

function countLines(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return data.split(/\r?\n/).length;
}

function gatherStats() {
    const categories = fs.readdirSync(questsDir).filter((name) => {
        const p = path.join(questsDir, name);
        return fs.statSync(p).isDirectory();
    });
    const stats = categories.map((cat) => {
        const catDir = path.join(questsDir, cat);
        const files = fs.readdirSync(catDir).filter((f) => f.endsWith('.json'));
        const lines = files.reduce((sum, file) => sum + countLines(path.join(catDir, file)), 0);
        return { category: cat, quests: files.length, lines };
    });
    return stats;
}

async function createChart(stats) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const width = 800;
    const height = 600;
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
    const labels = stats.map((s) => s.category);
    const questCounts = stats.map((s) => s.quests);
    const lineCounts = stats.map((s) => s.lines);

    const config = {
        type: 'radar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Quest Count',
                    data: questCounts,
                    borderColor: 'rgba(75, 192, 192, 0.8)',
                    backgroundColor: 'rgba(75, 192, 192, 0.4)',
                },
                {
                    label: 'Total Lines',
                    data: lineCounts,
                    borderColor: 'rgba(153, 102, 255, 0.8)',
                    backgroundColor: 'rgba(153, 102, 255, 0.4)',
                },
            ],
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Quest Tree Stats',
                },
            },
            scales: {
                r: {
                    beginAtZero: true,
                },
            },
        },
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config);
    fs.writeFileSync(outputFile, buffer);
}

async function main() {
    const stats = gatherStats();
    await createChart(stats);
    const summary = stats
        .map((s) => `${s.category}: ${s.quests} quests, ${s.lines} lines`)
        .join('\n');
    fs.writeFileSync(path.join(outputDir, 'quest-tree-stats.txt'), summary + '\n');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
