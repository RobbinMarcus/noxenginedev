(() => {
    const root = document.querySelector('[data-benchmark-chart]');
    if (!root) return;
    const { series, labels } = JSON.parse(root.querySelector('[data-chart-data]').textContent);
    const gpuButtons = [...root.querySelectorAll('[data-chart-gpu]')];
    const engineButtons = [...root.querySelectorAll('[data-chart-engine]')];
    const runButtons = [...root.querySelectorAll('[data-chart-run]')];
    // The run is "cold", "low" or "high". Cold runs use the Low output size.
    let run = 'low';
    const sizeKey = () => (run === 'cold' ? 'low' : run);
    const chartTitle = root.querySelector('[data-chart-title]');
    const chartSubtitle = root.querySelector('[data-chart-subtitle]');
    const engineNames = { comfy: 'ComfyUI', nox: 'Nox' };
    const pressed = buttons => buttons.filter(button => button.getAttribute('aria-pressed') === 'true');
    const selectedEngines = () => pressed(engineButtons).map(button => button.dataset.chartEngine);
    const container = root.querySelector('.benchmark-chart-panels');
    const tooltip = root.querySelector('.benchmark-chart-tooltip');
    const empty = root.querySelector('.benchmark-chart-empty');
    const status = root.querySelector('[data-chart-status]');
    const values = new Map();
    const names = new Map();
    const outputs = new Map();
    series.forEach(gpu => {
        values.set(gpu.id, new Map(gpu.rows.map(row => [row.pipeline, row])));
        gpu.rows.forEach(row => names.set(row.pipeline, row.name));
        gpu.rows.forEach(row => { if (row.sizes?.output) outputs.set(row.pipeline, row.sizes.output); });
    });
    // Each output type gets its own panel and time axis, so seconds-long images are not flattened by minute-long videos.
    // Pipelines without a known output type go to the first panel.
    const panelNodes = [...root.querySelectorAll('[data-chart-panel]')];
    const panels = panelNodes.map((node, index) => ({
        node,
        output: node.dataset.chartPanel,
        axis: node.querySelector('.benchmark-chart-axis'),
        scroller: node.querySelector('.benchmark-chart-scroll'),
        svg: node.querySelector('.benchmark-chart-svg'),
        size: node.querySelector('[data-chart-size]'),
        hint: node.querySelector('.benchmark-chart-scroll-hint'),
        pipelines: [...names].filter(([pipeline]) => outputs.get(pipeline) === node.dataset.chartPanel
            || (index === 0 && !panelNodes.some(other => other.dataset.chartPanel === outputs.get(pipeline))))
            .sort(([a], [b]) => a.localeCompare(b)),
    }));
    const height = 336;
    const top = 12;
    const baseline = 280;
    const formatTime = value => `${value.toFixed(2)} s`;
    const element = (name, attributes, text) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', name);
        Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const hideTooltip = () => { tooltip.hidden = true; };
    const positionTooltip = (clientX, clientY) => {
        const bounds = root.getBoundingClientRect();
        const left = Math.min(clientX - bounds.left + 16, bounds.width - tooltip.offsetWidth - 8);
        const upper = Math.min(clientY - bounds.top + 16, bounds.height - tooltip.offsetHeight - 8);
        tooltip.style.left = `${Math.max(8, left)}px`;
        tooltip.style.top = `${Math.max(8, upper)}px`;
    };
    const result = (gpu, pipeline) => values.get(gpu.id).get(pipeline)?.[run];
    const showTooltip = (group, gpu, pipeline, row, size, event) => {
        tooltip.replaceChildren();
        tooltip.style.setProperty('--chart-gpu', gpu.color);
        const title = document.createElement('strong');
        title.textContent = pipeline;
        const subtitle = document.createElement('span');
        subtitle.className = 'benchmark-chart-tooltip-gpu';
        subtitle.textContent = size ? `${gpu.name} · ${size}` : gpu.name;
        tooltip.append(title, subtitle);
        const engines = selectedEngines();
        const entries = row ? engines.map(engine => [engineNames[engine], formatTime(row[engine]), engine]) : [[labels.missing, '', 'missing']];
        if (row && engines.length === 2) entries.push([labels.speedup, `${row.speedup.toFixed(2)}×`, 'speedup']);
        entries.forEach(([name, value, engine]) => {
            const entry = document.createElement('div');
            entry.className = `benchmark-chart-tooltip-row benchmark-chart-tooltip-${engine}`;
            const label = document.createElement('span');
            label.textContent = name;
            const timing = document.createElement('b');
            timing.textContent = value;
            entry.append(label, timing);
            tooltip.append(entry);
        });
        tooltip.hidden = false;
        const bounds = group.getBoundingClientRect();
        positionTooltip(event?.clientX ?? bounds.left + bounds.width / 2, event?.clientY ?? bounds.top + 32);
    };
    const renderPanel = (panel, pipelines, active, engines) => {
        const { axis, scroller, svg } = panel;
        const sizes = [...new Set(active.flatMap(gpu => pipelines.map(([pipeline]) => values.get(gpu.id).get(pipeline)?.sizes?.[sizeKey()]).filter(Boolean).map(size => size.split(' · ')[0])))];
        panel.size.textContent = sizes.join(', ');
        const maximum = Math.max(0.01, ...active.flatMap(gpu => pipelines.flatMap(([pipeline]) => {
            const row = result(gpu, pipeline);
            return row ? engines.map(engine => row[engine]) : [];
        })));
        const magnitude = 10 ** Math.floor(Math.log10(maximum / 5));
        const step = [1, 2, 2.5, 5, 10].find(value => value * magnitude >= maximum / 5) * magnitude;
        const ticks = Math.ceil(maximum / step);
        const ceiling = ticks * step;
        const width = Math.max(scroller.clientWidth, pipelines.length * Math.max(62, active.length * (engines.length * 9 + 5) + 18));
        const groupWidth = width / pipelines.length;
        const pairWidth = (groupWidth - 14) / active.length;
        const barWidth = Math.min(22, (pairWidth - 5) / engines.length);
        const pairStep = engines.length * barWidth + 5;
        const y = value => baseline - value / ceiling * (baseline - top);
        axis.setAttribute('viewBox', `0 0 40 ${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        axis.replaceChildren();
        svg.replaceChildren();
        for (let tick = 0; tick <= ticks; tick += 1) {
            const value = tick * step;
            axis.append(element('text', { x: 32, y: y(value) + 4, 'text-anchor': 'end' }, String(Number(value.toPrecision(6)))));
            svg.append(element('line', { x1: 0, x2: width, y1: y(value), y2: y(value), class: tick === 0 ? 'benchmark-chart-baseline' : 'benchmark-chart-grid' }));
        }
        pipelines.forEach(([pipeline, name], pipelineIndex) => {
            const start = pipelineIndex * groupWidth;
            if (pipelineIndex % 2 === 0) svg.append(element('rect', { x: start, y: top, width: groupWidth, height: baseline - top, class: 'benchmark-chart-band' }));
            active.forEach((gpu, gpuIndex) => {
                const row = result(gpu, pipeline);
                const size = values.get(gpu.id).get(pipeline)?.sizes?.[sizeKey()];
                const center = start + groupWidth / 2 + (gpuIndex - (active.length - 1) / 2) * pairStep;
                const timings = row ? engines.map(engine => `${engineNames[engine]} ${formatTime(row[engine])}`).join(', ') : labels.missing;
                const description = row && engines.length === 2 ? `${timings}, ${row.speedup.toFixed(2)} times speedup` : timings;
                const group = element('g', { class: 'benchmark-chart-pair', tabindex: 0, role: 'img', 'aria-label': `${name}, ${gpu.name}: ${description}`, 'data-pipeline': pipeline, 'data-gpu': gpu.id });
                group.style.setProperty('--chart-gpu', gpu.color);
                group.append(element('rect', { x: center - pairStep / 2 + 1, y: top, width: pairStep - 2, height: baseline - top + 8, rx: 3, class: 'benchmark-chart-hit' }));
                if (row) {
                    engines.forEach((engine, engineIndex) => {
                        const x = center + (engineIndex - engines.length / 2) * barWidth;
                        group.append(element('rect', { x, y: y(row[engine]), width: barWidth, height: baseline - y(row[engine]), rx: 2, class: `benchmark-chart-bar benchmark-chart-${engine}`, 'data-engine': engine, 'data-time': row[engine] }));
                    });
                } else group.append(element('text', { x: center, y: baseline - 8, 'text-anchor': 'middle' }, '—'));
                group.addEventListener('pointerenter', event => {
                    if (event.pointerType !== 'touch') showTooltip(group, gpu, name, row, size, event);
                });
                group.addEventListener('pointermove', event => {
                    if (!tooltip.hidden && event.pointerType !== 'touch') positionTooltip(event.clientX, event.clientY);
                });
                group.addEventListener('pointerleave', () => {
                    if (document.activeElement !== group) hideTooltip();
                });
                group.addEventListener('focus', () => showTooltip(group, gpu, name, row, size));
                group.addEventListener('blur', hideTooltip);
                group.addEventListener('click', event => showTooltip(group, gpu, name, row, size, event));
                group.addEventListener('keydown', event => {
                    if (event.key === 'Escape') hideTooltip();
                    const pairs = [...svg.querySelectorAll('.benchmark-chart-pair')];
                    const index = pairs.indexOf(group);
                    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: pairs.length - 1 }[event.key];
                    if (next !== undefined) {
                        event.preventDefault();
                        pairs[Math.max(0, Math.min(pairs.length - 1, next))].focus();
                    }
                });
                svg.append(group);
            });
            const label = element('text', { x: start + groupWidth / 2, y: baseline + 22, 'text-anchor': 'middle', class: 'benchmark-chart-pipeline-label' });
            const lines = [];
            name.split(' ').forEach(word => {
                if (lines.length && `${lines[lines.length - 1]} ${word}`.length <= 11) lines[lines.length - 1] += ` ${word}`;
                else lines.push(word);
            });
            lines.forEach((line, index) => label.append(element('tspan', { x: start + groupWidth / 2, dy: index ? 14 : 0 }, line)));
            svg.append(label);
        });
        panel.hint.hidden = width <= scroller.clientWidth + 1;
    };
    const render = () => {
        hideTooltip();
        const selected = new Set(pressed(gpuButtons).map(button => button.dataset.chartGpu));
        const active = series.filter(gpu => selected.has(gpu.id));
        const engines = selectedEngines();
        const timing = run === 'cold' ? 'cold' : 'warm';
        chartTitle.textContent = labels.titles[timing];
        chartSubtitle.textContent = labels.subtitles[timing];
        // Only show pipelines that at least one selected GPU has a result for in this run.
        const visible = panels.map(panel => [panel, panel.pipelines.filter(([pipeline]) => active.some(gpu => result(gpu, pipeline)))]);
        const shown = visible.filter(([, pipelines]) => pipelines.length);
        const hasResults = engines.length > 0 && shown.length > 0;
        const emptyMessage = !active.length ? labels.empty : !engines.length ? labels.emptyEngines : labels.emptyResolution;
        container.hidden = !hasResults;
        empty.hidden = hasResults;
        empty.textContent = emptyMessage;
        const runName = runButtons.length ? ` ${runButtons.find(button => button.dataset.chartRun === run).textContent}` : '';
        const pipelineCount = shown.reduce((total, [, pipelines]) => total + pipelines.length, 0);
        const announcement = hasResults ? `Showing${runName} ${timing}-run ${engines.map(engine => engineNames[engine]).join(' and ')} times for ${active.map(gpu => gpu.name).join(', ')} across ${pipelineCount} pipelines.` : emptyMessage;
        if (status.textContent !== announcement) status.textContent = announcement;
        if (!hasResults) return;
        // Panel widths follow their pipeline counts, so every group gets about the same width.
        container.style.setProperty('--chart-columns', shown.map(([, pipelines]) => `minmax(0, ${Math.max(pipelines.length, 3.5)}fr)`).join(' '));
        visible.forEach(([panel, pipelines]) => { panel.node.hidden = !pipelines.length; });
        shown.forEach(([panel, pipelines]) => renderPanel(panel, pipelines, active, engines));
    };
    [...gpuButtons, ...engineButtons].forEach(button => button.addEventListener('click', () => {
        button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
        render();
    }));
    runButtons.forEach(button => button.addEventListener('click', () => {
        run = button.dataset.chartRun;
        runButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        render();
    }));
    panels.forEach(({ scroller, svg }) => scroller.addEventListener('scroll', () => {
        if (!tooltip.hidden && svg.contains(document.activeElement)) {
            const bounds = document.activeElement.getBoundingClientRect();
            positionTooltip(bounds.left + bounds.width / 2, bounds.top + 32);
        } else hideTooltip();
    }, { passive: true }));
    document.addEventListener('pointerdown', event => { if (!panels.some(({ svg }) => svg.contains(event.target))) hideTooltip(); });
    root.hidden = false;
    render();
    let resizeFrame;
    let lastWidth = 0;
    new ResizeObserver(() => {
        if (container.clientWidth === lastWidth) return;
        lastWidth = container.clientWidth;
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(render);
    }).observe(container);
})();
