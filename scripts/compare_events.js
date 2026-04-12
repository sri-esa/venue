const fs = require('fs');
const args = process.argv.slice(2);
const options = {};
args.forEach(arg => {
    const [key, value] = arg.split('=');
    options[key.replace('--', '')] = value;
});

const current = JSON.parse(fs.readFileSync(options.current, 'utf-8'));
const previous = JSON.parse(fs.readFileSync(options.previous, 'utf-8'));

const delta = {
    metrics: {}
};

for (const key of Object.keys(current)) {
    if (typeof current[key] === 'number' && previous[key] !== undefined) {
        let diff = current[key] - previous[key];
        let pct = (diff / previous[key]) * 100;
        let trend = diff > 0 ? "↑" : (diff < 0 ? "↓" : "→");
        let flag = "";
        
        if (pct < -10) flag = "[IMPROVEMENT]"; // Contextual, lower is usually better for wait times
        if (pct > 20) flag = "[REGRESSION]";

        delta.metrics[key] = { current: current[key], previous: previous[key], delta: `${diff.toFixed(2)} (${pct.toFixed(1)}%) ${trend} ${flag}` };
    }
}

fs.writeFileSync(options.output, JSON.stringify(delta, null, 2));
console.log('Events diffed successfully.');
