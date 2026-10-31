(() => {
    const element = (name, attributes, text) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', name);
        Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
        if (text !== undefined) node.textContent = text;
        return node;
    };
    document.querySelectorAll('[data-budget-chart]').forEach(root => {
        const points = JSON.parse(root.querySelector('[data-chart-data]').textContent);
        const svg = root.querySelector('.budget-chart-svg');
        const tooltip = root.querySelector('.benchmark-chart-tooltip');
        const status = root.querySelector('[data-chart-status]');
        const height = 360;
        const top = 14;
        const baseline = 300;
        const left = 44;
        const intervals = 5;
        const timeCeiling = 100;
        const lossCeiling = 25;
        let x = () => 0;
        let right = 0;
        let crosshair;
        let active = -1;
        const yTime = value => baseline - value / timeCeiling * (baseline - top);
        const yLoss = value => top + value / lossCeiling * (baseline - top);
        const line = (key, y, className) => element('polyline', { points: points.map(point => `${x(point.budget)},${y(point[key])}`).join(' '), class: `budget-chart-line ${className}` });
        const hide = () => {
            tooltip.hidden = true;
            active = -1;
            if (crosshair) crosshair.setAttribute('visibility', 'hidden');
        };
        const show = index => {
            const point = points[index];
            active = index;
            crosshair.setAttribute('x1', x(point.budget));
            crosshair.setAttribute('x2', x(point.budget));
            crosshair.setAttribute('visibility', 'visible');
            tooltip.replaceChildren();
            const title = document.createElement('strong');
            title.textContent = point.budget === 100 ? 'Dense' : `${point.label} budget`;
            tooltip.append(title);
            const rows = [['Warm request', `${point.time.toFixed(1)} s`], ['Laplacian loss', `${point.loss.toFixed(1)}%`]];
            if (point.budget !== 100) rows.push(['Saved', `${point.saved}%`]);
            rows.forEach(([name, value]) => {
                const row = document.createElement('div');
                row.className = 'benchmark-chart-tooltip-row';
                const label = document.createElement('span');
                label.textContent = name;
                const number = document.createElement('b');
                number.textContent = value;
                row.append(label, number);
                tooltip.append(row);
            });
            tooltip.hidden = false;
            const bounds = svg.getBoundingClientRect();
            const outer = root.getBoundingClientRect();
            const anchor = bounds.left - outer.left + x(point.budget) / svg.viewBox.baseVal.width * bounds.width;
            const position = anchor + 16 + tooltip.offsetWidth > root.clientWidth - 8 ? anchor - 16 - tooltip.offsetWidth : anchor + 16;
            tooltip.style.left = `${Math.max(8, position)}px`;
            tooltip.style.top = `${bounds.top - outer.top + 24}px`;
            status.textContent = `${title.textContent}: warm request ${point.time.toFixed(1)} seconds, Laplacian loss ${point.loss.toFixed(1)}%.`;
        };
        const nearest = event => {
            const bounds = svg.getBoundingClientRect();
            const position = (event.clientX - bounds.left) / bounds.width * svg.viewBox.baseVal.width;
            let best = 0;
            points.forEach((point, index) => {
                if (Math.abs(x(point.budget) - position) < Math.abs(x(points[best].budget) - position)) best = index;
            });
            return best;
        };
        const render = () => {
            const width = Math.round(svg.getBoundingClientRect().width);
            if (!width) return;
            const compact = width < 480;
            right = width - 44;
            x = budget => left + budget / 100 * (right - left);
            svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
            svg.replaceChildren();
            for (let tick = 0; tick <= intervals; tick += 1) {
                const y = baseline - tick / intervals * (baseline - top);
                svg.append(element('line', { x1: left, x2: right, y1: y, y2: y, class: tick === 0 ? 'benchmark-chart-baseline' : 'benchmark-chart-grid' }));
                svg.append(element('text', { x: left - 8, y: y + 4, 'text-anchor': 'end' }, `${tick / intervals * timeCeiling} s`));
                svg.append(element('text', { x: right + 8, y: y + 4 }, `${(intervals - tick) / intervals * lossCeiling}%`));
            }
            points.forEach(point => {
                if (compact && point.budget === 10) return;
                svg.append(element('text', { x: x(point.budget), y: baseline + 22, 'text-anchor': 'middle' }, point.label));
            });
            svg.append(element('text', { x: (left + right) / 2, y: baseline + 50, 'text-anchor': 'middle', class: 'budget-chart-axis-title' }, 'Attention budget, share of video key tiles'));
            crosshair = element('line', { y1: top, y2: baseline, class: 'budget-chart-crosshair', visibility: 'hidden' });
            svg.append(crosshair);
            svg.append(line('time', yTime, 'budget-chart-line-time'));
            svg.append(line('loss', yLoss, 'budget-chart-line-loss'));
            points.forEach(point => {
                svg.append(element('circle', { cx: x(point.budget), cy: yTime(point.time), r: 5, class: 'budget-chart-mark budget-chart-mark-time' }));
                svg.append(element('rect', { x: x(point.budget) - 4.5, y: yLoss(point.loss) - 4.5, width: 9, height: 9, rx: 2, class: 'budget-chart-mark budget-chart-mark-loss' }));
            });
            svg.append(element('text', { x: x(72), y: yTime(62), 'text-anchor': 'middle', class: 'budget-chart-direct' }, 'Warm request time'));
            svg.append(element('text', { x: x(compact ? 20 : 18), y: yLoss(17), class: 'budget-chart-direct' }, 'Laplacian loss'));
            if (active >= 0) show(active);
        };
        svg.addEventListener('pointermove', event => {
            const index = nearest(event);
            if (index !== active) show(index);
        });
        svg.addEventListener('pointerleave', () => {
            if (document.activeElement !== svg) hide();
        });
        svg.addEventListener('blur', hide);
        svg.addEventListener('focus', () => {
            if (active < 0 && svg.matches(':focus-visible')) show(2);
        });
        svg.addEventListener('keydown', event => {
            if (event.key === 'Escape') return hide();
            const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: points.length - 1 }[event.key];
            if (next === undefined) return undefined;
            event.preventDefault();
            show(Math.max(0, Math.min(points.length - 1, next)));
            return undefined;
        });
        render();
        let resizeFrame;
        new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(render);
        }).observe(svg);
    });
})();
