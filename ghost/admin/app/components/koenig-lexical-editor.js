import Component from '@glimmer/component';
import React, {Suspense} from 'react';

class ErrorHandler extends React.Component {
    state = {
        hasError: false
    };

    static getDerivedStateFromError() {
        return {hasError: true};
    }

    render() {
        if (this.state.hasError) {
            return (
                <p className="koenig-react-editor-error">Loading has failed. Try refreshing the browser!</p>
            );
        }

        return this.props.children;
    }
}

const fetchKoenig = function () {
    let status = 'pending';
    let response;

    const fetchPackage = async () => {
        if (window.KoenigLexical) {
            return window.KoenigLexical;
        }

        // the manual specification of the protocol in the import template string is
        // required to work around ember-auto-import complaining about an unknown dynamic import
        // during the build step
        const GhostAdmin = window.GhostAdmin || window.Ember.Namespace.NAMESPACES.find(ns => ns.name === 'ghost-admin');
        const url = new URL(GhostAdmin.__container__.lookup('service:config').get('editor.lexicalUrl'));

        if (url.protocol === 'http:') {
            await import(`http://${url.host}${url.pathname}`);
        } else {
            await import(`https://${url.host}${url.pathname}`);
        }

        return window.KoenigLexical;
    };

    const suspender = fetchPackage().then(
        (res) => {
            status = 'success';
            response = res;
        },
        (err) => {
            status = 'error';
            response = err;
        }
    );

    const read = () => {
        switch (status) {
        case 'pending':
            throw suspender;
        case 'error':
            throw response;
        default:
            return response;
        }
    };

    return {read};
};

const editorResource = fetchKoenig();

const KoenigComposer = (props) => {
    const {KoenigComposer: _KoenigComposer} = editorResource.read();
    return <_KoenigComposer {...props} />;
};

const KoenigEditor = (props) => {
    const {KoenigEditor: _KoenigEditor} = editorResource.read();
    return <_KoenigEditor {...props} />;
};

export default class KoenigLexicalEditor extends Component {
    ReactComponent = () => {
        return (
            <div className={['koenig-react-editor', this.args.className].filter(Boolean).join(' ')}>
                <ErrorHandler>
                    <Suspense fallback={<p className="koenig-react-editor-loading">Loading editor...</p>}>
                        <KoenigComposer>
                            <KoenigEditor />
                        </KoenigComposer>
                    </Suspense>
                </ErrorHandler>
            </div>
        );
    };
}
