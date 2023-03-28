import { alert } from 'ui/components';
import { directive, dom, emitter, node, render } from 'ui/lib';
import { user } from 'dapp';
import manifest from './dapp/manifest';


let cache = [],
    id,
    initiated = false;


const nodapps = (identity) => `
    <div class="card --background-grey-400 --border-radius-600 --flex-center --margin-top --margin-200 --padding --padding-800">
        <div class='--text-center'>
            No DApps found for the identity <br> <b class='--text-crop-bottom'>${identity}</b>
        </div>
    </div>
`;

const template = (data) => `
    <div class="card --background-white-400 --border-radius-600 --margin-top --margin-200 --padding --padding-500">
        <div class="--flex-row">
            <img alt="" class='image --background-black-500 --border-radius --border-radius-500 --flex-fixed --margin-right --margin-300 --size-800' src="">

            <div class="--flex-fill --flex-vertical">
                <div class="text-list --text-crop-top">
                    <b class="text --text-500">
                        ${data.name}
                    </b>

                    <div class="text --color-text-300 --margin-0px --padding-right --padding-400 --text-100">
                        <span class="--text-truncate">
                            ${data.description}
                        </span>
                    </div>
                </div>

                <div class="list --margin-100">
                    <div class="list-item list-item--bulletpoint --background-black-400 --text-200">
                        <a class='link --color-secondary --color-state --color-text-500 --inline --text-bold' href='https://ipfs.io/ipfs/${data.ipfs}' target='_blank'>
                            Open Using IPFS Gateway
                        </a>
                    </div>
                    <div class="list-item list-item--bulletpoint --background-black-400 --text-200">
                        <a class='link --color-secondary --color-state --color-text-500 --inline --text-bold' href='https://cloudflare-ipfs.com/ipfs/${data.ipfs}' target='_blank'>
                            Open Using Cloudflare IPFS Gateway
                        </a>
                    </div>
                </div>
            </div>

            <div class="--width --width-400">
                <div class="button button--circle tooltip --background-state --background-white --color-black-400 --color-state --color-text --padding-300" data-bind='{"id": "${data.id}", "name": "${data.name}", "refs": {"modal": "modal.update"}}' data-click='manager.update.click' data-hover='tooltip'>
                    <div class="icon">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M14.5 3h-2.893C9.397 3 8.565 1.832 8 1.401S6.5 1 6.5 1h-5A1.5 1.5 0 000 2.5v3A1.5 1.5 0 011.5 4h13A1.5 1.5 0 0116 5.5v-1A1.5 1.5 0 0014.5 3z"/><path opacity=".85" d="M16 13.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 010 13.5v-8A1.5 1.5 0 011.5 4h13A1.5 1.5 0 0116 5.5v8z"/></svg>
                    </div>

                    <span class="tooltip-message tooltip-message--ne">
                        Upload DApp Update
                    </span>
                </div>
            </div>

            <div class="--width --width-400">
                <div class="button button--circle tooltip --background-state --background-white --color-black-400 --color-state --color-text --padding-300" data-bind='{"id": "${data.id}", "name": "${data.name}", "refs": {"modal": "modal.delete"}}' data-click='manager.delete.click' data-hover='tooltip'>
                    <div class="icon">
                        <svg width="16" height="16" viewBox="0 0 16 16"><path d="M14.001 2.25h-3.688V.578A.578.578 0 009.734 0H6.265a.578.578 0 00-.578.578V2.25H2.001a1 1 0 000 2h12a1 1 0 100-2zM6.843 1.157h2.313V2.25H6.843V1.157zM8 5.45H2.771l.614 9.536A1.166 1.166 0 004.541 16h6.918c.592 0 1.08-.441 1.156-1.014l.613-9.536H8z"/></svg>
                    </div>

                    <span class="tooltip-message tooltip-message--ne">
                        Delete DApp
                    </span>
                </div>
            </div>
        </div>
    </div>
`;


const del = {
    click: function() {
        id = this.id;

        if (!id) {
            alert.error('Cannot proceed, missing document id');
            return;
        }

        let name = dom.ref('delete.name');

        if (name) {
            dom.update(() => {
                node.text(name.element, this.name);
            });
        }

        directive.dispatch('modal', {}, this);
    },
    confirm: async function() {
        if (!id) {
            alert.error('Cannot proceed, missing document id');
            return;
        }

        this.element.classList.add('button--processing');

        await manifest.delete([cache[id]]);

        alert.success(`Successfully deleted DApp: ${id}`);
        emitter.dispatch('dapps.modified');

        dom.ref('modals.container').element.click();
    }
};

const init = async function() {
    let dapps,
        identity = await user.identity.get(),
        rows = (dom.ref('manager.rows') || {}).element;

    if (!rows) {
        return;
    }

    dapps = await manifest.read({
        query: {
            where: ['identityId', '=', identity]
        }
    });

    if (!dapps.length) {
        dom.update(() => {
            node.html(rows, { inner: nodapps(identity) });
        });
        return;
    }

    dapps = dapps.map((response) => {
        let id = response.id.toString();

        cache[id] = response;
        cache[id].data.id = id;

        return cache[id].data;
    });

    dom.update(() => {
        node.html(rows, { inner: render.template(template, dapps) });
    });
}


directive.on('manager.delete.click', del.click);
directive.on('manager.delete.confirm', del.confirm);

emitter.on('user.init', () => {
    if (initiated) {
        return;
    }

    initiated = true;

    setTimeout(init, 1000);
});
emitter.on('dapps.modified', init);


export default { cache };
