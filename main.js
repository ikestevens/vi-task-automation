/*  Food Visualizer – v9
    ───────────────────────────────────────────
      Stage        Visible   Template-match
      random   →    60 %        0  %
      slight   →    60 %       33  %
      closer   →    60 %       66  %
      final    →    60 %      100  %  (edge-filled)

      40 % of tiles are blank in every stage.
      A new food template is chosen every full cycle.
*/

new p5((p) => {
    /* ---------- Config ---------- */
    const stages  = ["random", "slight", "closer", "final"];
    const transMS = 2000, holdMS = 4000;

    const palette = [
        p.color('#D4C454'),   // 1 wall yellow
        p.color('#447604'),   // 2 avocado green
        p.color('#208AAE'),   // 3 blue
        p.color('#F28482')    // 4 coral
    ];

    /* ---------- Globals ---------- */
    let grid, cols, rows, blocks = [];

    const foodFiles = [];            // ["banana.json", "apple.json", ...]
    const foodData  = new Map();     // filename -> rawTemplate array
    let currentFood = "";            // filename w/o .json
    let rawTemplate = null;

    let templateCells = [];          // [{r,c,idx}]
    const edgeMap = new Map();       // "r_c" -> idx (template only)
    let majorityEdgeIdx = 0;         // dominant edge colour index

    let automation = 0.601;          // 60.1 % visible
    let stageIdx   = 0;
    let stageStart = 0;

    /* ---------- Preload ---------- */
    p.preload = () => {
        p.loadJSON("vi_auto_data.json",
            d => automation = d.automation_percentage,
            () => console.warn("vi_auto_data.json not found; using 60 %")
        );

        // manifest lists available food JSON files
        p.loadJSON("foods/manifest.json", list => {
            list.forEach(file => {
                foodFiles.push(file);
                p.loadJSON(`foods/${file}`, raw => {
                    foodData.set(file, raw);
                    if (!rawTemplate) {
                        rawTemplate = raw;
                        currentFood = file.replace(".json", "");
                    }
                });
            });
        });
    };

    /* ---------- Setup + Resize ---------- */
    p.setup         = () => init();
    p.windowResized = () => init();

    function init() {
        if (!rawTemplate) { setTimeout(init, 50); return; }

        p.createCanvas(p.windowWidth, p.windowHeight);
        computeGrid();
        buildTemplate(rawTemplate);
        initBlocks();
        setStage("random");
        stageStart = p.millis();
    }

    function computeGrid() {
        const h = rawTemplate.length;
        const w = rawTemplate[0].length;
        grid = Math.floor(Math.min(p.width / w, p.height / h));
        cols = Math.floor(p.width  / grid);
        rows = Math.floor(p.height / grid);
    }

    /* ---------- Template builder ---------- */
    function getMajorityEdgeColorIdx(raw) {
        const h = raw.length, w = raw[0].length;
        const counts = new Array(palette.length).fill(0);

        for (let i = 0; i < w; i++) {
            counts[+raw[0][i] - 1]++;           // top row
            counts[+raw[h - 1][i] - 1]++;       // bottom row
        }
        for (let j = 0; j < h; j++) {
            counts[+raw[j][0]     - 1]++;       // left col
            counts[+raw[j][w - 1] - 1]++;       // right col
        }
        return counts.indexOf(Math.max(...counts));
    }

    function buildTemplate(raw) {
        templateCells.length = 0;
        edgeMap.clear();

        const h = raw.length, w = raw[0].length;
        const scale = Math.floor(Math.min(cols / w, rows / h));
        const offC  = Math.floor((cols - w * scale) / 2);
        const offR  = Math.floor((rows - h * scale) / 2);

        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const idx = +raw[r][c] - 1;
                if (idx < 0 || idx >= palette.length) continue;
                for (let dy = 0; dy < scale; dy++) {
                    for (let dx = 0; dx < scale; dx++) {
                        const gr = offR + r * scale + dy;
                        const gc = offC + c * scale + dx;
                        templateCells.push({ r: gr, c: gc, idx });
                        edgeMap.set(`${gr}_${gc}`, idx);
                    }
                }
            }
        }
        majorityEdgeIdx = getMajorityEdgeColorIdx(raw);  // ⬅️ store for final stage
    }

    /* ---------- Blocks ---------- */
    const idx = (c, r) => r * cols + c;

    function initBlocks() {
        blocks = Array.from({ length: cols * rows }, () => ({
            x: p.random(p.width), y: p.random(p.height),
            fx: 0, fy: 0, tx: 0, ty: 0, col: null
        }));
    }

    function shuffleBlocks() { p.shuffle(blocks, true); }

    function assignAll(colFn) {
        shuffleBlocks();
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const b = blocks[idx(c, r)];
                b.fx = b.x; b.fy = b.y;
                b.tx = c * grid; b.ty = r * grid;
                b.col = colFn(c, r);
            }
        }
    }

    /* ---------- Stage logic ---------- */
    function setStage(name) {
        console.log(`Stage: ${name}`);
        if (name === "random") {
            assignAll(() =>
                Math.random() < automation ? p.random(palette) : null);
            return;
        }

        if (name === "slight" || name === "closer") {
            const frac  = name === "slight" ? 0.33 : 0.66;
            const need  = Math.floor(templateCells.length * frac);
            const chosen = p.shuffle([...templateCells]).slice(0, need);
            const chosenSet = new Set(chosen.map(c => `${c.r}_${c.c}`));
            const colMap = new Map(chosen.map(c => [`${c.r}_${c.c}`, c.idx]));

            assignAll((c, r) => {
                if (Math.random() > automation) return null;        // blank 40 %
                const k = `${r}_${c}`;
                if (chosenSet.has(k)) return palette[colMap.get(k)];
                return p.random(palette);
            });
            return;
        }

        if (name === "final") {
            assignAll((c, r) => {
                if (Math.random() > automation) return null;        // blank 40 %
                const k = `${r}_${c}`;
                const idx = edgeMap.has(k) ? edgeMap.get(k) : majorityEdgeIdx;
                return palette[idx];
            });
        }
    }

    function pickNewFood() {
        if (foodFiles.length === 0) return;
        const next = p.random(foodFiles);
        currentFood = next.replace(".json", "");
        rawTemplate = foodData.get(next);
        buildTemplate(rawTemplate);
    }

    function nextStage() {
        stageIdx = (stageIdx + 1) % stages.length;
        if (stageIdx === 0) pickNewFood();  // new food each cycle
        stageStart = p.millis();
        setStage(stages[stageIdx]);
    }

    /* ---------- Draw loop ---------- */
    p.draw = () => {
        p.background(240);

        const t  = p.constrain((p.millis() - stageStart) / transMS, 0, 1);
        const ez = t * t * (3 - 2 * t);

        blocks.forEach(b => {
            b.x = p.lerp(b.fx, b.tx, ez);
            b.y = p.lerp(b.fy, b.ty, ez);
            if (b.col) { p.noStroke(); p.fill(b.col); p.rect(b.x, b.y, grid, grid); }
        });

        if (t >= 1 && p.millis() - stageStart > transMS + holdMS) nextStage();
        drawPanel();
        drawFoodPanel();
    };

    /* ---------- Panel ---------- */
    function drawPanel() {
        const pad   = 20;
        const label = "VI Task Automation";
        const pct   = `${(automation * 100).toFixed(1)}%`;

        // Calculate width based on the widest line
        p.textSize(22);
        const titleWidth = p.textWidth(label);
        p.textSize(36);
        const pctWidth = p.textWidth(pct);
        const w = Math.max(titleWidth, pctWidth) + pad * 2;

        const h = 100; // Reduced height since we only have two lines
        const x = p.width - w - pad;
        const y = pad;

        // Background panel
        p.noStroke();
        p.fill(0, 180);
        p.rect(x, y, w, h, 14);

        p.textAlign(p.LEFT, p.CENTER);
        p.textStyle(p.BOLD);
        p.fill(255);

        // Line 1: Title (left aligned)
        p.textSize(22);
        p.text(label, x + pad, y + h * 0.3);

        // Line 2: Percentage (center aligned)
        p.textSize(36);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(pct, x + w / 2, y + h * 0.72);
    }

    function drawFoodPanel() {
        const pad     = 20;
        const food    = currentFood;
        const fullTxt = food;

        // Stage 0 & 1: skip entirely
        if (stageIdx < 2) return;

        const isCloser = stageIdx === 2;
        const isFinal  = stageIdx === 3;
        const h = 80;

        // Text setup
        p.textSize(22);
        const w = p.textWidth(fullTxt) + pad * 2;
        const x = pad;
        const y = p.height - h - pad;

        // === Visual params ===
        let alpha = 100;
        let blur  = 14;

        if (isFinal) {
            const fadeDuration = 500; // ms
            const t = p.constrain((p.millis() - stageStart) / fadeDuration, 0, 1);
            alpha = p.lerp(100, 255, t);
            blur  = p.lerp(4, 0, t);
        }

        // Panel background
        p.noStroke();
        p.fill(0, alpha * 0.8);  // Panel stays semi-transparent
        p.rect(x, y, w, h, 14);

        // Text
        p.textAlign(p.LEFT, p.CENTER);
        p.textStyle(p.BOLD);
        p.textSize(22);
        p.drawingContext.filter = `blur(${blur}px)`;
        p.fill(255, alpha);
        p.text(fullTxt, x + pad, y + h / 2);
        p.drawingContext.filter = 'none'; // Reset after draw
    }
});
