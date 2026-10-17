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

/** How long a message stays unless it reports a failure, which stays until clicked. */
const messageLifetimeMs = 60_000;

/** The one button, plus a status line under it, fixed at the page's top right. */
export class Panel {
    private readonly button = document.createElement('button');
    private readonly status = document.createElement('div');
    private hideTimer: ReturnType<typeof setTimeout> | undefined;

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
            cursor: 'pointer',
        });
        this.status.title = '點一下關閉';
        this.button.addEventListener('click', onClick);
        this.status.addEventListener('click', () => {
            this.showMessage('', false);
        });
        area.append(this.button, this.status);
        document.body.append(area);
        this.setState({ kind: 'checking' });
    }

    /**
     * @param persist Keep the message until clicked instead of hiding it after a minute.
     *   Defaults to true in the error state, so a failure is not missed.
     */
    setState(state: PanelState, message = '', persist = state.kind === 'error'): void {
        this.button.textContent = state.kind === 'busy' ? state.label : labels[state.kind];
        this.button.disabled = state.kind === 'checking' || state.kind === 'busy';
        this.showMessage(message, persist);
    }

    private showMessage(message: string, persist: boolean): void {
        clearTimeout(this.hideTimer);
        this.status.textContent = message;
        this.status.style.display = message ? '' : 'none';
        if (message && !persist) {
            this.hideTimer = setTimeout(() => {
                this.showMessage('', false);
            }, messageLifetimeMs);
        }
    }
}
