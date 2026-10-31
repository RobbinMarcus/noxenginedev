// Draws which key tiles one source tile attends to, from routes.json (tools/sparse-attention/build_figure.py).
(() => {
    const Colors = {
        source: "#3fe08a",
        sourceLine: "#b5ffd6",
        active: "#f5b83d",
        activeLine: "#ffe2a1",
        dim: "rgba(7, 9, 15, 0.52)",
    };
    const ActiveAlpha = { sparse: 0.46, dense: 0.3 };
    const MaxThreads = 40;
    // Where the source tile starts and how it moves until the reader takes over, as (column, row) fractions.
    const SourcePath = [[0.5, 0.42], [0.3, 0.6], [0.72, 0.55], [0.5, 0.2], [0.18, 0.3], [0.62, 0.82]];
    const CycleMilliseconds = 2600;
    const Modes = [
        { id: "dense", label: "Dense" },
        { id: "raster", label: "Raster 15%" },
        { id: "calibrated", label: "Calibrated 15%" },
        { id: "veda", label: "Veda 15%" },
    ];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const dataPromises = new Map();
    const loadData = (url) => {
        if (!dataPromises.has(url)) dataPromises.set(url, fetch(url).then((response) => response.json()));
        return dataPromises.get(url);
    };

    function makeElement(tag, className, parent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (parent) parent.append(element);
        return element;
    }

    function setup(root, data) {
        const [, rows, columns] = data.grid;
        const base = root.dataset.base;
        const stage = root.querySelector(".attention-stage");
        const threads = root.querySelector(".attention-threads");
        const controls = root.querySelector(".attention-controls");
        const timeline = root.querySelector(".attention-timeline");
        const readout = root.querySelector(".attention-readout");
        const showTabs = root.dataset.tabs !== "false";
        const state = { mode: root.dataset.initialMode || "calibrated", view: data.defaultView ?? 0, cell: null, pathIndex: 0, touched: false };

        const panels = data.frames.map((frame, index) => {
            const panel = makeElement("div", `attention-panel attention-panel-${["before", "middle", "after"][index]}`, stage);
            const image = makeElement("img", "", panel);
            image.src = `${base}${data.images[index]}`;
            image.alt = "";
            image.width = 1344;
            image.height = 768;
            const canvas = makeElement("canvas", "", panel);
            const label = makeElement("span", "attention-panel-label", panel);
            label.textContent = `Frame ${data.videoFrames[index]}`;
            const anchor = makeElement("i", "attention-anchor", panel);
            return { panel, canvas, anchor };
        });

        const available = Modes.filter((mode) => mode.id !== "veda" || data.views.some((view) => view.modes.veda));
        const modeButtons = (showTabs ? available : []).map((mode) => {
            const button = makeElement("button", "attention-mode", controls);
            button.type = "button";
            button.textContent = mode.label;
            button.disabled = mode.id === "calibrated" && !data.views.some((view) => view.modes.calibrated);
            button.addEventListener("click", () => {
                state.mode = mode.id;
                state.touched = true;
                draw();
            });
            return { button, mode };
        });

        // One fixed dense view has nothing to choose: every head and block attends to every tile.
        const picker = makeElement("select", "attention-view", showTabs || state.mode !== "dense" ? controls : null);
        picker.setAttribute("aria-label", "Transformer block and attention head");
        data.views.forEach((view, index) => {
            const option = makeElement("option", "", picker);
            option.value = index;
            option.textContent = `Block ${view.block + 1}, head ${view.head + 1}`;
        });
        picker.addEventListener("change", () => {
            state.view = Number(picker.value);
            state.touched = true;
            draw();
        });

        const bars = Array.from({ length: data.grid[0] }, (_, frame) => {
            const bar = makeElement("span", data.frames.includes(frame) ? "is-shown" : "", timeline);
            return makeElement("i", "", bar);
        });

        function currentRoute() {
            const view = data.views[state.view];
            const mode = state.mode === "dense" ? "raster" : state.mode;
            const entry = view.modes[mode] ?? view.modes.raster;
            const map = data.maps[entry.map];
            const [column, row] = state.cell ?? [
                Math.floor(SourcePath[state.pathIndex][0] * columns),
                Math.floor(SourcePath[state.pathIndex][1] * rows),
            ];
            const query = map[1][row * columns + column] >> 1;
            return { map, query, route: entry.routes[query], entry };
        }

        function drawPanel(index, map, query, keys) {
            const { canvas } = panels[index];
            const scale = window.devicePixelRatio || 1;
            const width = Math.round(canvas.offsetWidth * scale);
            const height = Math.round(canvas.offsetHeight * scale);
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }
            const context = canvas.getContext("2d");
            const cellWidth = width / columns;
            const cellHeight = height / rows;
            const tiles = map[index];
            const dense = keys === null;
            const stateOf = (tile) => {
                if (tile >> 1 === query) return 2;
                return dense || keys.has(tile) ? 1 : 0;
            };
            const centers = new Map();

            context.clearRect(0, 0, width, height);
            for (let row = 0; row < rows; ++row) {
                for (let column = 0; column < columns; ++column) {
                    const tile = tiles[row * columns + column];
                    const cellState = stateOf(tile);
                    const x = Math.round(column * cellWidth);
                    const y = Math.round(row * cellHeight);
                    const nextX = Math.round((column + 1) * cellWidth);
                    const nextY = Math.round((row + 1) * cellHeight);
                    if (cellState === 0) {
                        context.fillStyle = Colors.dim;
                    } else if (cellState === 1) {
                        context.fillStyle = Colors.active;
                        context.globalAlpha = dense ? ActiveAlpha.dense : ActiveAlpha.sparse;
                    } else {
                        context.fillStyle = Colors.source;
                        context.globalAlpha = 0.62;
                    }
                    context.fillRect(x, y, nextX - x, nextY - y);
                    context.globalAlpha = 1;
                    if (cellState === 1) {
                        const center = centers.get(tile) ?? { x: 0, y: 0, count: 0 };
                        center.x += column + 0.5;
                        center.y += row + 0.5;
                        center.count += 1;
                        centers.set(tile, center);
                    }
                }
            }

            // Tile outlines, drawn only where neighbouring cells belong to different tiles.
            const outline = (wanted, color, lineWidth) => {
                context.strokeStyle = color;
                context.lineWidth = lineWidth * scale;
                context.beginPath();
                for (let row = 0; row < rows; ++row) {
                    for (let column = 0; column < columns; ++column) {
                        const tile = tiles[row * columns + column];
                        if (stateOf(tile) !== wanted) continue;
                        const x = column * cellWidth;
                        const y = row * cellHeight;
                        if (column === columns - 1 || tiles[row * columns + column + 1] !== tile) {
                            context.moveTo(x + cellWidth, y);
                            context.lineTo(x + cellWidth, y + cellHeight);
                        }
                        if (column === 0 || tiles[row * columns + column - 1] !== tile) {
                            context.moveTo(x, y);
                            context.lineTo(x, y + cellHeight);
                        }
                        if (row === rows - 1 || tiles[(row + 1) * columns + column] !== tile) {
                            context.moveTo(x, y + cellHeight);
                            context.lineTo(x + cellWidth, y + cellHeight);
                        }
                        if (row === 0 || tiles[(row - 1) * columns + column] !== tile) {
                            context.moveTo(x, y);
                            context.lineTo(x + cellWidth, y);
                        }
                    }
                }
                context.stroke();
            };
            outline(1, Colors.activeLine, dense ? 0.5 : 1);
            outline(2, Colors.sourceLine, 1.6);
            return centers;
        }

        function project(index, column, row) {
            const { anchor } = panels[index];
            anchor.style.left = `${(column / columns) * 100}%`;
            anchor.style.top = `${(row / rows) * 100}%`;
            const point = anchor.getBoundingClientRect();
            const origin = stage.getBoundingClientRect();
            return [point.left - origin.left, point.top - origin.top];
        }

        function drawThreads(map, query, allCenters) {
            threads.replaceChildren();
            if (state.mode === "dense") return;
            const origin = stage.getBoundingClientRect();
            threads.setAttribute("viewBox", `0 0 ${origin.width} ${origin.height}`);
            let sourceColumn = 0;
            let sourceRow = 0;
            let sourceCount = 0;
            map[1].forEach((tile, cell) => {
                if (tile >> 1 !== query) return;
                sourceColumn += (cell % columns) + 0.5;
                sourceRow += Math.floor(cell / columns) + 0.5;
                sourceCount += 1;
            });
            if (!sourceCount) return;
            const [startX, startY] = project(1, sourceColumn / sourceCount, sourceRow / sourceCount);
            const targets = allCenters.flatMap((centers, index) => [...centers.values()].map((center) => ({ index, ...center })));
            const stride = Math.max(1, Math.ceil(targets.length / MaxThreads));
            targets.filter((_, position) => position % stride === 0).forEach((target) => {
                const [endX, endY] = project(target.index, target.x / target.count, target.y / target.count);
                const lift = target.index === 1 ? 0.18 : 0.3;
                const middleX = (startX + endX) / 2;
                const middleY = Math.min(startY, endY) - Math.abs(endX - startX) * lift;
                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                path.setAttribute("d", `M${startX} ${startY}Q${middleX} ${middleY} ${endX} ${endY}`);
                threads.append(path);
                const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                dot.setAttribute("cx", endX);
                dot.setAttribute("cy", endY);
                dot.setAttribute("r", 2.5);
                threads.append(dot);
            });
            const start = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            start.setAttribute("cx", startX);
            start.setAttribute("cy", startY);
            start.setAttribute("r", 5);
            start.setAttribute("class", "is-source");
            threads.append(start);
        }

        function draw() {
            const { map, query, route, entry } = currentRoute();
            const dense = state.mode === "dense";
            const keys = dense ? null : new Set(route?.keys ?? []);
            const centers = panels.map((_, index) => drawPanel(index, map, query, keys));
            drawThreads(map, query, centers);

            const timelineValues = dense ? Array(data.grid[0]).fill(rows * columns) : route?.timeline ?? [];
            bars.forEach((bar, frame) => (bar.style.height = `${(100 * (timelineValues[frame] ?? 0)) / (rows * columns)}%`));
            const used = dense ? data.videoKeyTiles : route?.keys.length ?? 0;
            const total = dense ? data.videoKeyTiles : entry.total ?? data.videoKeyTiles;
            const shapeName = state.mode === "raster" || dense ? null : entry.shape ?? data.views[state.view].shape;
            const shape = shapeName ? ` · ${shapeName.replaceAll("x", "×")} tiles` : "";
            readout.textContent = `${used} of ${total} video key tiles · ${Math.round((used / total) * 100)}%${shape}`;
            modeButtons.forEach(({ button, mode }) => button.setAttribute("aria-pressed", mode.id === state.mode));
            picker.value = state.view;
            picker.disabled = state.mode === "dense";
            root.dataset.mode = state.mode;
        }

        const middle = panels[1].canvas;
        middle.addEventListener("pointermove", (event) => {
            state.touched = true;
            state.cell = [
                Math.min(Math.max(Math.floor((event.offsetX / middle.offsetWidth) * columns), 0), columns - 1),
                Math.min(Math.max(Math.floor((event.offsetY / middle.offsetHeight) * rows), 0), rows - 1),
            ];
            draw();
        });
        middle.addEventListener("pointerleave", () => {
            state.cell = null;
            draw();
        });

        panels[1].panel.querySelector("img").addEventListener("load", draw);
        new ResizeObserver(draw).observe(stage);

        if (!reducedMotion) {
            let visible = false;
            new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0.3 }).observe(root);
            setInterval(() => {
                if (!visible || state.touched) return;
                state.pathIndex = (state.pathIndex + 1) % SourcePath.length;
                draw();
            }, CycleMilliseconds);
        }
        draw();
    }

    document.querySelectorAll(".attention-tiles").forEach((root) => {
        loadData(root.dataset.src).then((data) => setup(root, data));
    });
})();
