import { Column, type ValueChange } from '@watchlist/game-record-writer';

export type PanelState =
    | { kind: 'checking' }
    | { kind: 'add' }
    | { kind: 'update' }
    | { kind: 'busy'; label: string }
    | { kind: 'error' };

const labels: Record<PanelState['kind'], string> = {
    checking: '查詢 Sheet…',
    add: '＋ 新增',
    update: '↻ 更新',
    busy: '',
    error: '重試',
};

/**
 * @returns e.g. `原價 459 → 499（+40）`, `上市 2026/2/26 → 2026/3/5（+7 天）` or
 *   `備註 中位1H，3rd.高2H。 → 中位33H，3rd.高145H。`.
 */
export function formatChange({ column, oldValue, newValue, delta }: ValueChange): string {
    const unit = column === Column.releaseDate ? ' 天' : '';
    const signed = delta === null ? '' : `（${delta > 0 ? '+' : ''}${delta}${unit}）`;
    return `${column} ${oldValue ?? '（無）'} → ${newValue}${signed}`;
}

/** The one button, plus a status line under it, fixed at the page's top right. */
export class Panel {
    private readonly button = document.createElement('button');
    private readonly status = document.createElement('div');

    constructor(onClick: () => void) {
        const area = document.createElement('div');
        area.id = 'EkkoSteamSheetWriter';
        Object.assign(area.style, {
            position: 'fixed', right: '25px', top: '20px', zIndex: '50',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
        });
        Object.assign(this.button.style, { height: '32px', minWidth: '96px', padding: '0 12px', cursor: 'pointer' });
        Object.assign(this.status.style, {
            maxWidth: '320px', padding: '2px 6px', whiteSpace: 'pre-line', textAlign: 'right',
            fontSize: '12px', color: '#fff', background: 'rgba(0, 0, 0, 0.7)', borderRadius: '3px',
        });
        this.button.addEventListener('click', onClick);
        area.append(this.button, this.status);
        document.body.append(area);
        this.setState({ kind: 'checking' });
    }

    setState(state: PanelState, message = ''): void {
        this.button.textContent = state.kind === 'busy' ? state.label : labels[state.kind];
        this.button.disabled = state.kind === 'checking' || state.kind === 'busy';
        this.status.textContent = message;
        this.status.style.display = message ? '' : 'none';
    }
}
