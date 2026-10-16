(() => {
    const root = document.querySelector('[data-benchmark-chart]');
    if (!root) return;
    const { series, labels } = JSON.parse(root.querySelector('[data-chart-data]').textContent);
    const gpuButtons = [...root.querySelectorAll('[data-chart-gpu]')];
    const engineButtons = [...root.querySelectorAll('[data-chart-engine]')];
    const engineNames = { comfy: 'ComfyUI', nox: 'Nox' };
    const selectedEngines = () => engineButtons.filter(button => button.getAttribute('aria-pressed') === 'true').map(button => button.dataset.chartEngine);
    const plot = root.querySelector('.benchmark-chart-plot');
    const axis = root.querySelector('.benchmark-chart-axis');
    const scroller = root.querySelector('.benchmark-chart-scroll');
    const svg = root.querySelector('.benchmark-chart-svg');
    const tooltip = root.querySelector('.benchmark-chart-tooltip');
    const empty = root.querySelector('.benchmark-chart-empty');
    const hint = root.querySelector('.benchmark-chart-scroll-hint');
    const status = root.querySelector('[data-chart-status]');
    const pipelines = new Map();
    const values = new Map();
    series.forEach(gpu => {
        values.set(gpu.id, new Map(gpu.rows.map(row => [row.pipeline, row])));
        gpu.rows.forEach(row => pipelines.set(row.pipeline, row.name));
    });
    const height = 432;
    const top = 16;
    const baseline = 320;
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
    const showTooltip = (group, gpu, pipeline, row, event) => {
        tooltip.replaceChildren();
        tooltip.style.setProperty('--chart-comfy', gpu.colors.comfy);
        tooltip.style.setProperty('--chart-nox', gpu.colors.nox);
        const title = document.createElement('strong');
        title.textContent = pipeline;
        const subtitle = document.createElement('span');
        subtitle.className = 'benchmark-chart-tooltip-gpu';
        subtitle.textContent = gpu.name;
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
    const render = () => {
        hideTooltip();
        const selected = new Set(gpuButtons.filter(button => button.getAttribute('aria-pressed') === 'true').map(button => button.dataset.chartGpu));
        const active = series.filter(gpu => selected.has(gpu.id));
        const engines = selectedEngines();
        root.dataset.engines = engines.join(' ');
        const hasResults = active.length > 0 && engines.length > 0;
        const emptyMessage = active.length ? labels.emptyEngines : labels.empty;
        plot.hidden = !hasResults;
        empty.hidden = hasResults;
        empty.textContent = emptyMessage;
        hint.hidden = true;
        const announcement = hasResults ? `Showing warm-run ${engines.map(engine => engineNames[engine]).join(' and ')} times for ${active.map(gpu => gpu.name).join(', ')} across ${pipelines.size} pipelines.` : emptyMessage;
        if (status.textContent !== announcement) status.textContent = announcement;
        if (!hasResults) return;
        const maximum = Math.max(0.01, ...active.flatMap(gpu => gpu.rows.flatMap(row => engines.map(engine => row[engine]))));
        const magnitude = 10 ** Math.floor(Math.log10(maximum / 5));
        const step = [1, 2, 2.5, 5, 10].find(value => value * magnitude >= maximum / 5) * magnitude;
        const ticks = Math.ceil(maximum / step);
        const ceiling = ticks * step;
        const width = Math.max(scroller.clientWidth, pipelines.size * Math.max(78, active.length * 20 + 10));
        const groupWidth = width / pipelines.size;
        const pairWidth = (groupWidth - 14) / active.length;
        const barWidth = Math.min(24, (pairWidth - 5) / engines.length);
        const pairStep = engines.length * barWidth + 5;
        const y = value => baseline - value / ceiling * (baseline - top);
        axis.setAttribute('viewBox', `0 0 44 ${height}`);
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('width', width);
        svg.setAttribute('height', height);
        axis.replaceChildren();
        svg.replaceChildren();
        for (let tick = 0; tick <= ticks; tick += 1) {
            const value = tick * step;
            axis.append(element('text', { x: 34, y: y(value) + 4, 'text-anchor': 'end' }, String(Number(value.toPrecision(6)))));
            svg.append(element('line', { x1: 0, x2: width, y1: y(value), y2: y(value), class: tick === 0 ? 'benchmark-chart-baseline' : 'benchmark-chart-grid' }));
        }
        let pipelineIndex = 0;
        pipelines.forEach((name, pipeline) => {
            const start = pipelineIndex * groupWidth;
            if (pipelineIndex % 2 === 0) svg.append(element('rect', { x: start, y: top, width: groupWidth, height: baseline - top, class: 'benchmark-chart-band' }));
            active.forEach((gpu, gpuIndex) => {
                const row = values.get(gpu.id).get(pipeline);
                const center = start + groupWidth / 2 + (gpuIndex - (active.length - 1) / 2) * pairStep;
                const timings = row ? engines.map(engine => `${engineNames[engine]} ${formatTime(row[engine])}`).join(', ') : labels.missing;
                const description = row && engines.length === 2 ? `${timings}, ${row.speedup.toFixed(2)} times speedup` : timings;
                const group = element('g', { class: 'benchmark-chart-pair', tabindex: 0, role: 'img', 'aria-label': `${name}, ${gpu.name}: ${description}`, 'data-pipeline': pipeline, 'data-gpu': gpu.id });
                group.style.setProperty('--chart-comfy', gpu.colors.comfy);
                group.style.setProperty('--chart-nox', gpu.colors.nox);
                group.append(element('rect', { x: center - pairStep / 2 + 1, y: top, width: pairStep - 2, height: baseline - top + 54, rx: 3, class: 'benchmark-chart-hit' }));
                if (row) {
                    engines.forEach((engine, engineIndex) => {
                        const x = center + (engineIndex - engines.length / 2) * barWidth;
                        group.append(element('rect', { x, y: y(row[engine]), width: barWidth, height: baseline - y(row[engine]), rx: 2, class: `benchmark-chart-bar benchmark-chart-${engine}`, 'data-engine': engine, 'data-time': row[engine] }));
                    });
                } else group.append(element('text', { x: center, y: baseline - 12, 'text-anchor': 'middle' }, '—'));
                const gpuLabel = active.length > 1 ? { x: center + 3, y: baseline + 12, transform: `rotate(-65 ${center + 3} ${baseline + 12})`, 'text-anchor': 'end' } : { x: center, y: baseline + 22, 'text-anchor': 'middle' };
                group.append(element('text', { ...gpuLabel, class: 'benchmark-chart-gpu-label' }, gpu.name));
                group.addEventListener('pointerenter', event => {
                    if (event.pointerType !== 'touch') showTooltip(group, gpu, name, row, event);
                });
                group.addEventListener('pointermove', event => {
                    if (!tooltip.hidden && event.pointerType !== 'touch') positionTooltip(event.clientX, event.clientY);
                });
                group.addEventListener('pointerleave', () => {
                    if (document.activeElement !== group) hideTooltip();
                });
                group.addEventListener('focus', () => showTooltip(group, gpu, name, row));
                group.addEventListener('blur', hideTooltip);
                group.addEventListener('click', event => showTooltip(group, gpu, name, row, event));
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
            const label = element('text', { x: start + groupWidth / 2, y: baseline + 78, 'text-anchor': 'middle', class: 'benchmark-chart-pipeline-label' });
            const lines = [];
            name.split(' ').forEach(word => {
                if (lines.length && `${lines[lines.length - 1]} ${word}`.length <= 14) lines[lines.length - 1] += ` ${word}`;
                else lines.push(word);
            });
            lines.forEach((line, index) => label.append(element('tspan', { x: start + groupWidth / 2, dy: index ? 15 : 0 }, line)));
            svg.append(label);
            pipelineIndex += 1;
        });
        hint.hidden = width <= scroller.clientWidth + 1;
    };
    [...gpuButtons, ...engineButtons].forEach(button => button.addEventListener('click', () => {
        button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
        render();
    }));
    scroller.addEventListener('scroll', () => {
        if (!tooltip.hidden && svg.contains(document.activeElement)) {
            const bounds = document.activeElement.getBoundingClientRect();
            positionTooltip(bounds.left + bounds.width / 2, bounds.top + 32);
        } else hideTooltip();
    }, { passive: true });
    document.addEventListener('pointerdown', event => { if (!svg.contains(event.target)) hideTooltip(); });
    root.hidden = false;
    render();
    let resizeFrame;
    new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(render);
    }).observe(scroller);
})();
