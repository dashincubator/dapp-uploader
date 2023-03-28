import { alert } from 'ui/components';
import { directive, dom, emitter, node } from 'ui/lib';
import { storage } from 'dapp';
import manifest from './dapp/manifest';
import manager from './manager';


let cid,
    data,
    id,
    ignorelist = [
        '/node_modules/',
        '/.'
    ],
    upload = [];


function ignore(path) {
    if (!path) {
        return true;
    }

    for (let i = 0, n = ignorelist.length; i < n; i++) {
        if (path.includes(ignorelist[i])) {
            return true;
        }
    }

    return false;
}

async function save(data) {
    let { description, name, repository, version } = data,
        doc = { description, ipfs: cid, name, repository, version };

    if (id) {
        doc.id = id;
    }

    await manifest.save([doc])

    if (id) {
        alert.success(`Successfully updated DApp: ${id}`);
        emitter.dispatch('dapps.modified');

        dom.ref('modals.container').element.click();
    }
    else {
        alert.success('Dash Document saved successfully! Check console for output');
    }
}


const managerUpdater = function() {
    id = this.id;

    if (!id) {
        alert.error('Cannot proceed, missing document id');
        return;
    }

    let name = dom.ref('update.name');

    if (name) {
        dom.update(() => {
            node.text(name.element, this.name);
        });
    }

    directive.dispatch('modal', {}, this);
};

const onchange = async function (e) {
    e.preventDefault();
    e.stopPropagation();

    // Reset Upload List
    cid = null;
    upload = [];

    for (let i = 0, n = this.element.files.length; i < n; i++) {
        let file = this.element.files[i],
            path = file.webkitRelativePath,
            root;

        if (ignore(path)) {
            continue;
        }

        if (!root) {
            root = `${path.split('/')[0]}/`
        }

        path = path.substring(root.length);

        if (path.includes('package.json')) {
            data = JSON.parse(await file.text());

            if (typeof data.dapp === 'object' && data.dapp !== null) {
                data = Object.assign(data, data.dapp);
            }
        }

        upload.push({
            content: await file.text(),
            path: path
        });
    }

    cid = await storage.ipfs.upload.files(upload);

    if (!data) {
        dom.ref('upload.package').element.classList.remove('--hidden');
    }
    else {
        await save(data);
    }

    // Display IPFS Link
    if (cid && this.refs.success) {
        if (id) {
            emitter.dispatch('dapps.modified');
            dom.ref('modals.container').element.click();
        }
        else {
            this.element.labels[0].classList.add('--hidden');
            this.refs.success.classList.remove('--hidden');
            this.refs.ipfs.textContent = `https://ipfs.io/ipfs/${cid} - https://cloudflare-ipfs.com/ipfs/${cid}`;
        }
    }
};

const uploadPackage = async function (e) {
    e.preventDefault();
    e.stopPropagation();

    let file = this.element.files[0];

    if (file.type !== 'application/json') {
        return;
    }

    data = JSON.parse(await file.text());

    if (typeof data.dapp === 'object' && data.dapp !== null) {
        data = Object.assign(data, data.dapp);
    }

    if (!data) {
        alert.error('There was an issue with your package.json, please try again.');
    }
    else {
        await save(data);
        dom.ref('upload.package').element.classList.add('--hidden');
    }
};

const reset = function (e) {
    this.value = '';
};


directive.on('manager.update.click', managerUpdater);

directive.on('upload.ipfs.package', uploadPackage);
directive.on('upload.ipfs.onchange', onchange);
directive.on('upload.ipfs.reset', reset);
