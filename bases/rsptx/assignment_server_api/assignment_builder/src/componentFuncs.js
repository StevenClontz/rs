// Render a question in the provided div.

// TODO: remove document.querySelector dependency
export async function renderRunestoneComponent(
    previewRef, // This is a React ref object
    moreOpts
) {
    /**
     *  The HTML template for the component is in the innerHTML of the
     *  previewRef.  whenever the  template changes we need to re-render
     *  We do this by extracing the [data-component] attribute and then
     *  Use the value of that attribute to look up the component factory
     *  The component factory then turns the template into the fully rendered
     * component.
     */
    if (typeof moreOpts === "undefined") {
        moreOpts = {};
    }
    var author = null;
    if ("author" in moreOpts) {
        author = moreOpts.author;
        delete moreOpts.author;
    }
    let patt = /..\/_images/g;
    previewRef.current.innerHTML = previewRef.current.innerHTML.replace(
        patt,
        `${window.eBookConfig.app}/books/published/${window.eBookConfig.basecourse}/_images`
    );

    if (typeof window.componentMap === "undefined") {
        window.componentMap = {};
    }

    // figure out what kind of component we are dealing with
    let componentKind =
        previewRef.current.querySelector(`[data-component]`).dataset.component;
    // webwork problems do not have a data-component attribute so we have to try to figure it out.
    //
    if (
        (!componentKind &&
            previewRef.current.innerHTML.indexOf("handleWW") >= 0) ||
        previewRef.current.innerHTML.indexOf("webwork") >= 0
    ) {
        componentKind = "webwork";
    }
    // Import all the js needed for this component before rendering
    await window.runestoneComponents.runestone_import(componentKind);
    let opt = {};
    opt.orig = previewRef.current.querySelector(`[data-component]`);
    if (opt.orig) {
        opt.lang = opt.orig.dataset.lang;
        if (!opt.lang) {
            opt.lang = opt.orig.querySelector("[data-lang]").dataset.lang;
        }
        // We don't want to store runs or keep results so set useServices to fales
        opt.useRunestoneServices = false;
        opt.graderactive = false;
        opt.python3 = true;
        if (typeof moreOpts !== "undefined") {
            for (let key in moreOpts) {
                opt[key] = moreOpts[key];
            }
        }
    }

    // loading a valid component will also initialize the component factory
    if (typeof component_factory === "undefined") {
        alert(
            "Error:  Missing the component factory!  probably a webpack version mismatch"
        );
    } else {
        if (!window.component_factory[componentKind] && !previewRef.innerHTML) {
            previewRef.current.innerHTML = `<p>Preview not available for ${componentKind}</p>`;
        } else {
            try {
                let res = window.component_factory[componentKind](opt);
                res.multiGrader = moreOpts.multiGrader;
                if (componentKind === "activecode") {
                    if (moreOpts.multiGrader) {
                        window.componentMap[
                            `${moreOpts.gradingContainer} ${res.divid}`
                        ] = res;
                    } else {
                        window.componentMap[res.divid] = res;
                    }
                }
            } catch (e) {
                console.log(e);
                previewRef.current.innerHTML = `<p>An error occurred while trying to render a ${componentKind}</p>`;
            }
        }
    }
    // TODO: Make sure MathJax is loaded and typeset the preview
    //MathJax.typeset([previewRef.current]);
}

export function createActiveCodeTemplate(
    uniqueId,
    instructions,
    language,
    prefix_code,
    starter_code,
    suffix_code
) {
    var preview_src = `
<div class="ptx-runestone-container">
<div class="runestone explainer ac_section ">
<div data-component="activecode" id="${uniqueId}" data-question_Form.Label="4.2.2.2">
<div class="ac_question">
<p>${instructions}</p>

</div>
<textarea data-lang="${language}" id="${uniqueId}_editor"
    data-timelimit=25000  data-codelens="true"  style="visibility: hidden;"
    data-audio=''
    data-wasm=/_static
    >
${prefix_code}
^^^^
${starter_code}
====
${suffix_code}

</textarea>
</div>
</div>
</div>
    `;
    return preview_src;
}