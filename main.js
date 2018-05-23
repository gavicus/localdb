var Model;
(function (Model) {
    class Data {
        static initToc() {
            let toc = {
                lastId: 0,
                ids: [],
            };
            let jtoc = JSON.stringify(toc);
            localStorage.setItem('toc', jtoc);
            return toc;
        }
        static get toc() {
            let toc = localStorage.toc;
            if (toc) {
                return JSON.parse(toc);
            }
            else {
                return this.initToc();
            }
        }
        static get entryTypes() {
            let types = [];
            for (let id of Data.toc.ids) {
                let entry = Data.getEntry(id);
                if (types.indexOf(entry.type) === -1) {
                    types.push(entry.type);
                }
            }
            return types;
        }
        static getEntry(id) {
            let entry = localStorage.getItem(id);
            if (entry) {
                return JSON.parse(entry);
            }
            else {
                return null;
            }
        }
        static query(q) {
            let toc = Data.toc;
            let result = [];
            for (let id of toc.ids) {
                let entry = Data.getEntry(id);
                let ok = true;
                for (let key of Object.keys(q)) {
                    if (entry[key] !== q[key]) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    result.push(entry);
                }
            }
            return result;
        }
    }
    Data.g = true;
    Model.Data = Data;
})(Model || (Model = {}));
var Page;
(function (Page_1) {
    let Pages;
    (function (Pages) {
        Pages[Pages["Debug"] = 0] = "Debug";
        Pages[Pages["Gallery"] = 1] = "Gallery";
        Pages[Pages["Image"] = 2] = "Image";
        Pages[Pages["NewPic"] = 3] = "NewPic";
        Pages[Pages["Subject"] = 4] = "Subject";
        Pages[Pages["Subjects"] = 5] = "Subjects";
    })(Pages || (Pages = {}));
    ;
    class Page {
        static showDebug() { Debug.render(); }
        static showSubjects() { Subjects.render(); }
        static showSubject(id) { Subject.render(id); }
        static showGallery(query) { Gallery.render(query); }
        static showImage(id) { Image.render(id); }
        static showNewPic() { NewPic.render(); }
        static render(markup) {
            let menu = Page.generateMenu();
            document.getElementById('page-area').innerHTML = menu + markup;
        }
        static generateMenu() {
            let links = "";
            let names = ['Debug', 'Subjects'];
            for (let name of names) {
                links += Page.generateElement('a', name, { onclick: 'Page.Page.show' + name + '()' });
            }
            return "<div class='links'>" + links + "</div>";
        }
        static generateElement(tag, inner, attributes = {}, options = {}) {
            let markup = "<" + tag;
            for (let key of Object.keys(attributes)) {
                markup += " " + key + "='" + attributes[key] + "'";
            }
            markup += ">";
            if (inner) {
                markup += inner;
            }
            markup += "</" + tag + ">";
            if (options) {
                if (options.wrap) {
                    markup = Page.generateElement('div', markup, options.wrap);
                }
            }
            return markup;
        }
        static generateMenuOptions(names) {
            let options = "";
            for (let name of names) {
                options += Page.generateElement('option', name, { value: name });
            }
            return options;
        }
        static generateThumbnail(imageData, onclick = null) {
            let image = Page.generateElement('img', null, { src: imageData.url, style: 'max-width:120;' });
            let thumb = Page.generateElement('div', image, {
                class: 'thumb',
                style: 'max-width:120;',
            });
            let attributes = { class: 'subject-row' };
            if (onclick) {
                attributes['onclick'] = onclick;
            }
            let markup = Page.generateElement('div', thumb, attributes);
            return markup;
        }
    }
    Page.pageName = Pages.Debug;
    Page_1.Page = Page;
    class Debug {
        static render() {
            Page.pageName = Pages.Debug;
            let markup = "";
            let buttons = "<div class='buttons'>";
            for (let btn of Debug.buttons) {
                buttons += Page.generateElement('button', btn.display, { onclick: btn.action });
            }
            let options = Page.generateElement('option', 'type', { value: '' });
            for (let t of Model.Data.entryTypes) {
                options += Page.generateElement('option', t, { value: t });
            }
            buttons += Page.generateElement('select', options, { onchange: 'Page.Debug.selectType()', id: 'type-select' });
            options = Page.generateElement('option', 'id', { value: '' });
            for (let id of Model.Data.toc.ids) {
                options += Page.generateElement('option', id, { value: id });
            }
            buttons += Page.generateElement('select', options, { onchange: 'Page.Debug.showItem()', id: 'id-select' });
            buttons += "</div>";
            markup += buttons;
            markup += "<div id='debug-display'></div>";
            Page.render(markup);
        }
        static selectType() {
            let element = document.getElementById('type-select');
            let value = element.value;
            let ids = [];
            if (value) {
                let entries = Model.Data.query({ type: value });
                for (let entry of entries) {
                    ids.push(entry.id);
                }
            }
            else {
                ids = Model.Data.toc.ids;
            }
            let options = Page.generateElement('option', 'id', { value: '' });
            options += Page.generateMenuOptions(ids);
            document.getElementById('id-select').innerHTML = options;
        }
        static showItem() {
            let element = document.getElementById('id-select');
            let value = element.value;
            if (!value) {
                return;
            }
            let item = Model.Data.getEntry(element.value);
            document.getElementById('debug-display').innerHTML = "<pre>" + JSON.stringify(item, null, 2) + "</pre>";
        }
        static showToc() {
            document.getElementById('debug-display').innerHTML = localStorage.toc;
        }
    }
    Debug.buttons = [{ display: 'toc', action: 'Page.Debug.showToc()' }];
    Page_1.Debug = Debug;
    class Gallery {
        static render(query) {
            Page.pageName = Pages.Gallery;
            query['type'] = 'pic';
            let images = Model.Data.query(query);
            console.log('images', images);
            let markup = "";
            for (let image of images) {
                let onclick = 'Page.Page.showImage(' + image.id + ')';
                markup += Page.generateThumbnail(image, onclick);
            }
            Page.render(markup);
        }
    }
    Page_1.Gallery = Gallery;
    class Image {
        static render(id) {
            Page.pageName = Pages.Image;
            Image.id = id;
            let imageData = Model.Data.getEntry(id);
            let markup = Page.generateElement('img', null, { src: imageData.url });
            Page.render(markup);
        }
    }
    Image.id = null;
    Page_1.Image = Image;
    class Subject {
        static render(id) {
            Page.pageName = Pages.Subject;
            if (id) {
                Subject.id = id;
            }
            else {
                id = Subject.id;
            }
            let subject = Model.Data.getEntry(id);
            console.log('subject', subject);
            let markup = "";
            markup += Page.generateElement('div', subject.name);
            markup += Page.generateThumbnail(Subject.getThumbData(Subject.id));
            let button = Page.generateElement('button', 'Gallery', {
                onclick: "Page.Page.showGallery({subject:" + Subject.id + "})"
            });
            markup += Page.generateElement('div', button);
            button = Page.generateElement('button', 'New Pic', { onclick: "Page.Page.showNewPic()" });
            markup += Page.generateElement('div', button);
            Page.render(markup);
        }
        static getThumbData(subjectid) {
            let subjectData = Model.Data.getEntry(subjectid);
            let thumbData = Model.Data.getEntry(subjectData.thumb);
            if (!thumbData) {
                let images = Model.Data.query({ type: 'pic', subject: subjectData.id });
                if (images.length > 0) {
                    thumbData = images[0];
                }
            }
            return thumbData;
        }
    }
    Subject.id = null;
    Page_1.Subject = Subject;
    class NewPic {
        static render() {
            Page.pageName = Pages.NewPic;
            let markup = "";
            markup += Page.generateElement('input', null, { placeholder: 'image url', id: 'image-url' }, { wrap: { class: 'foo' } });
            markup += Page.generateElement('button', 'submit', { onclick: 'Page.NewPic.onSubmit()' }, { wrap: { class: 'foo' } });
            Page.render(markup);
        }
        static onSubmit() {
            let input = document.getElementById('image-url');
            let value = input.value;
            console.log('value', value);
        }
    }
    Page_1.NewPic = NewPic;
    class Subjects {
        static render() {
            Page.pageName = Pages.Subjects;
            let markup = "";
            let subjects = Model.Data.query({ type: 'subject' });
            for (let subject of subjects) {
                let thumb = Subject.getThumbData(subject.id);
                let onclick = "Page.Subjects.onClickSubject(" + subject.id + ")";
                markup += Page.generateThumbnail(thumb, onclick);
            }
            Page.render(markup);
            Page.render(markup);
        }
        static onClickSubject(id) {
            Page.showSubject(id);
        }
    }
    Page_1.Subjects = Subjects;
    class ImageEdit {
    }
    Page_1.ImageEdit = ImageEdit;
})(Page || (Page = {}));
