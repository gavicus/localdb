namespace Page {
	enum Pages {
		ConfirmRemoveSubject,Debug,EditImage,Gallery,Image,NewPic,
		NewSubject,NewSubjectTag,Subject,SubjectFilter,Subjects,SubjectThumb
	};

	export class Page {
		static pageName: Pages = Pages.Debug;
		static thumbSize = 80;
		static thumbOuter = 120;

		static showDebug() { Debug.render(); }
		static showSubjects() { Subjects.render(); }
		static showSubject(id) { Subject.render(id); }
		static showGallery(query) { Gallery.render(query); }
		static showImage(id) { Image.render(id); }
		static showNewSubject() { NewSubject.render(); }
		static showEditImage() { EditImage.render(); }
		static showConfirmRemoveSubject() { ConfirmRemoveSubject.render() }
		static showNewSubjectTag() { NewSubjectTag.render() }
		static showSubjectFilter() { SubjectFilter.render() }
		static showSubjectThumb() { SubjectThumb.render() }

		static render(markup) {
			let menu = Page.generateMenu();
			document.getElementById('menu-links').innerHTML = menu;
			if (markup) {
				document.getElementById('page-area').innerHTML = markup;
			}
		}

		static generateMenu() {
			let links = "";
			let names = ['Debug','Subjects'];
			if (Page.pageName === Pages.Subjects) {
				names.push('NewSubject');
				names.push('SubjectFilter');
			}
			if (Page.pageName === Pages.Image) { names.push('EditImage'); }
			if (Page.pageName === Pages.Image) { names.push('Gallery'); }
			if (Page.pageName === Pages.Gallery) { names.push(''); }

			links += Page.generateElement('a','alt',{
				onclick:'Page.Subjects.toggleAltMode()',
				class: Subjects.alt ? 'alt-selected' : '',
			});

			for (let name of names) {
				links += Page.generateElement('a',name,{onclick:'Page.Page.show'+name+'()'});
			}
			if (Page.pageName === Pages.Gallery) {
				let subject = Model.Subject.read(Subject.id);
				let subjectName = 
				links += Page.generateElement('a',subject.name,{onclick:'Page.Page.showSubject()'});
			}
			return "<div class='links'>"+links+"</div>";
		}

		static generateElement(tag:string, inner:string, attributes:any={}, options:any={}): string {
			let markup = "<"+tag;
			for (let key of Object.keys(attributes)) {
				markup += " " + key + "='" + attributes[key] + "'";
			}
			markup += ">";
			if (inner) { markup += inner; }
			markup += "</"+tag+">";

			if (options) {
				if (options.wrap) {
					markup = Page.generateElement('div',markup,options.wrap);
				}
			}

			return markup;
		}

		static generateCheckbox(name, attribs, checked) {
			let attributes = {...attribs, type:'checkbox'};
			if (checked) { attributes['checked'] = true; }
			let input = Page.generateElement('input',null,attributes);
			return Page.generateElement('label',input+name);
		}

		static generateMenuOptions(names,selected=null) {
			let options = "";
			for (let name of names) {
				let attribs = {value:name};
				if (name === selected) { attribs['selected']='selected'; }
				options += Page.generateElement('option',name,attribs);
			}
			return options;
		}

		static generateSubjectThumbnail(subject: Model.Subject, onclick: string = null): string {
			// image
			let imageMarkup = '';
			let imageObject: Model.Picture = null;
			if (subject.thumb && subject.thumb.imageId) {
				imageObject = Model.Picture.read(subject.thumb.imageId);
			}
			if (imageObject) {
				let imgStyle = 'margin-left:'+subject.thumb.marginx+';margin-top:'+subject.thumb.marginy+';max-width:'+subject.thumb.maxwidth+';';
				let attribs = {src:imageObject.url, style:imgStyle,};
				imageMarkup = Page.generateElement('img',null,attribs);
			}
			else {
				let style = 'width:80px;height:80px;padding:10px 0 0 10px;';
				style += 'background-color:#888;';
				style += 'color:#aaa;font-size:42;font-family:sans-serif;font-weight:bold;';
				style += 'text-transform: capitalize;';
				style += 'box-shadow: inset 0px 0px 10px 2px white;';
				style += 'box-sizing: border-box';
				let attribs = {style:style,class:'thumb-placeholder'}
				imageMarkup = Page.generateElement('div',subject.name.substr(0,2),attribs);
			}

			// tooltip
			let tooltipMarkup = Page.generateElement('span',subject.name,{class:'tooltiptext'});

			// wrapper
			let wrapperStyle = 'height:'+Page.thumbSize+'px;width:'+Page.thumbSize+'px;';
			wrapperStyle += 'overflow:hidden;display:inline-block;';
			wrapperStyle += 'cursor:pointer;';
			if (!onclick) { onclick = 'Page.Page.showSubject('+subject.id+')'; }
			let wrapperAtribs = {style:wrapperStyle,onclick:onclick,class:'tooltip'};
			let wrapper = Page.generateElement('div',tooltipMarkup+imageMarkup,wrapperAtribs);

			return wrapper;
		}
		
		static generateThumbnail(imageData, onclick=null, tooltip=null, imageAttribs=null) {
			if (!imageAttribs) { imageAttribs = {}; }
			imageAttribs['src'] = imageData.url;
			if (!imageAttribs.hasOwnProperty('style')) { imageAttribs['style'] = ''; }
			if (imageAttribs.style.indexOf('max-width') === -1) {
				imageAttribs['style'] += 'height:80;max-width:120;';
			}
			let image = imageData
				? Page.generateElement('img',null,imageAttribs)
				: '';
			let thumb = Page.generateElement('div',image,{
				style:'max-width:120;border:1px solid white;',
			});
			let contents = thumb;
			let attributes = {class:'subject-row'};
			if(onclick){ attributes['onclick']=onclick; }
			if (tooltip) {
				let tooltipMarkup = Page.generateElement('span',tooltip,{class:'tooltiptext'});
				contents += tooltipMarkup;
				attributes.class += ' tooltip';
			}
			let markup = Page.generateElement('div',contents,attributes);
			return markup;
		}

	}

	export class ConfirmRemoveSubject {
		static render() {
			Page.pageName = Pages.ConfirmRemoveSubject;
			let subject = Model.Subject.read(Subject.id);
			let message = 'Really remove subject ' + subject.name + '?';
			let markup = Page.generateElement('div',message,{style:'margin:5px 0;'});
			let buttons = Page.generateElement('button','confirm',{
				onclick:'Page.ConfirmRemoveSubject.onConfirm()'
			});
			buttons += Page.generateElement('button','cancel',{
				onclick:'Page.ConfirmRemoveSubject.onCancel()'
			});
			markup += Page.generateElement('div',buttons);
			Page.render(markup);
		}
		static onConfirm(){
			// first remove the subject's properties
			let images = Model.Data.query({type:'pic', subject:Subject.id});
			for (let image of images) {
				Model.Data.removeEntry(image.id);
			}
			// then remove the subject itself
			Model.Data.removeEntry(Subject.id);
			Page.showSubjects();
		}
		static onCancel(){
			Page.showSubject(Subject.id);
		}
	}

	export class Debug {
		static buttons = [{display:'toc',action:'Page.Debug.showToc()'}];
		
		static render() {
			Page.pageName = Pages.Debug;
			let markup = "";
			let buttons = "<div class='buttons'>";
			for (let btn of Debug.buttons) {
				buttons += Page.generateElement('button',btn.display,{onclick:btn.action});
			}

			let options = Page.generateElement('option','type',{value:''});
			for (let t of Model.Data.entryTypes) {
				options += Page.generateElement('option',t,{value:t});
			}
			buttons += Page.generateElement('select',options,{onchange:'Page.Debug.selectType()',id:'type-select'});
			
			options = Page.generateElement('option','id',{value:''});
			for (let id of Model.Data.toc.ids) {
				options += Page.generateElement('option',id,{value:id});
			}
			buttons += Page.generateElement('select',options,{onchange:'Page.Debug.showItem()',id:'id-select'});
			
			buttons += "</div>";
			markup += buttons;
			markup += "<div id='debug-display'></div>";
			Page.render(markup);
		}

		static selectType() {
			let element:HTMLSelectElement = <HTMLSelectElement>document.getElementById('type-select');
			let value = element.value;
			let ids = [];
			if (value) {
				let entries = Model.Data.query({type:value});
				for (let entry of entries) {
					ids.push(entry.id);
				}
			}
			else {
				ids = Model.Data.toc.ids;
			}
			let options = Page.generateElement('option','id',{value:''});
			options += Page.generateMenuOptions(ids);
			document.getElementById('id-select').innerHTML = options;
		}

		static showItem() {
			let element:HTMLSelectElement = <HTMLSelectElement>document.getElementById('id-select');
			let value = element.value;
			if (!value) {return;}
			let item = Model.Data.getEntry(element.value);
			document.getElementById('debug-display').innerHTML = "<pre>"+JSON.stringify(item,null,2)+"</pre>";
		}

		static showToc() {
			document.getElementById('debug-display').innerHTML = localStorage.toc;
		}
	}

	export class EditImage {
		static imageId: number;
		static render() {
			Page.pageName = Pages.EditImage;
			EditImage.imageId = Image.id;
			let imageData = Model.Data.getEntry(EditImage.imageId);
			let markup = Page.generateThumbnail(imageData);
			let subject = Model.Data.getEntry(imageData.subject);
			markup += Page.generateElement('div','image id: '+imageData.id);
			markup += Page.generateElement('div','subject: '+subject.name+' ('+subject.id+')');
			markup += Page.generateElement('button','set subject thumb',{onclick:"Page.EditImage.onSetThumb()"});
			markup += Page.generateElement('button','remove image',{onclick:"Page.EditImage.onRemove()"});
			Page.render(markup);
		}
		static onRemove() {
			Model.Data.removeEntry(EditImage.imageId);
			Page.showGallery({subject:Subject.id});
		}
		static onSetThumb() {
			Gallery.onChooseThumb(EditImage.imageId);
		}
	}

	export class Gallery {
		static query: any;
		static images: any[];
		static chooseSubjectThumb = false;

		static render(query:any=null) {
			if (!query) { query = Gallery.query; }
			else { Gallery.query = query; }
			Page.pageName = Pages.Gallery;
			query['type']='pic';
			Gallery.images = Model.Data.query(query);
			let markup = "";
			if (Gallery.chooseSubjectThumb) {
				let subject = Model.Subject.read(Subject.id);
				markup += Page.generateElement('div','choose thumbnail for ' + subject.name);
			}
			for (let image of Gallery.images) {
				let onclick: string;
				if (Gallery.chooseSubjectThumb) {
					onclick = 'Page.Gallery.onChooseThumb('+image.id+')';
				} else {
					onclick = 'Page.Page.showImage('+image.id+')';
				}
				markup += Page.generateThumbnail(image,onclick);
			}
			Page.render(markup);
		}

		static getNextImageId(lastid: number): number {
			for (let i=0; i<Gallery.images.length; ++i) {
				let image = Gallery.images[i];
				if (image.id === lastid) {
					let nextIndex = i+1;
					if (nextIndex >= Gallery.images.length) {
						nextIndex = 0;
					}
					return Gallery.images[nextIndex].id;
				}
			}
		}

		static onChooseThumb(imageid: number): void {
			Gallery.chooseSubjectThumb = false;
			let subject = Model.Subject.read(Subject.id);
			subject.setThumb(imageid);
			subject.store();
			Page.showSubjectThumb();
		}
	}

	export class Image {
		static id:number = null;

		static render(id:number) {
			Page.pageName = Pages.Image;
			Image.id = id;
			let imageData = Model.Data.getEntry(id);
			let markup = Page.generateElement(
				'img',null,{src:imageData.url,onclick:'Page.Image.onclick()'}
			);
			Page.render(markup);
		}

		static onclick() {
			let nextid = Gallery.getNextImageId(Image.id);
			Image.render(nextid);
		}
	}

	export class NewPic {
		static render() {
			Page.pageName = Pages.NewPic;
			
			let markup = "";
			markup += Page.generateElement('input',null,{placeholder:'image url',id:'image-url'},{wrap:{}});
			markup += Page.generateElement('button','submit',{onclick:'Page.NewPic.onSubmit()'},{wrap:{}});
			Page.render(markup);
		}
		static onSubmit() {
			let input:HTMLInputElement = <HTMLInputElement>document.getElementById('image-url');
			let url = input.value;
			let pic = new Model.Picture(url);
			pic.subjectid = Subject.id;
			pic.store();
			input.value = '';
		}
	}

	export class NewSubject {
		static render() {
			Page.pageName = Pages.NewSubject;
			let markup = Page.generateElement(
				'input', null, {placeholder:'Subject Name', id:'subject-name'}, {wrap:{}}
			);
			markup += Page.generateElement(
				'button', 'submit', {onclick:'Page.NewSubject.onSubmit()'}
			);
			markup += Page.generateElement(
				'button', 'cancel', {onclick:'Page.NewSubject.onCancel()'}
			);
			Page.render(markup);
		}
		static onSubmit() {
			let element = <HTMLInputElement>document.getElementById('subject-name');
			let name = element.value;
			let subject = new Model.Subject(name);
			if (Subjects.alt) { subject.setTag('alt'); }
			subject.store();
			Page.showSubject(subject.id);
		}
		static onCancel() {
			Page.showSubjects();
		}
	}

	export class NewSubjectTag {
		static render() {
			Page.pageName = Pages.NewSubjectTag;
			let markup = Page.generateElement('div','new subject tag');
			markup += Page.generateElement('input',null,{placeholder:'new tag',id:'tag-name'},{wrap:{}});
			let buttons = Page.generateElement('button','submit',{onclick:'Page.NewSubjectTag.onSubmit()'});
			buttons += Page.generateElement('button','cancel',{onclick:'Page.NewSubjectTag.onCancel()'});
			markup += Page.generateElement('div',buttons);
			Page.render(markup);
		}
		static onSubmit() {
			let elem = <HTMLInputElement>document.getElementById('tag-name');
			let tagname = elem.value;
			Model.Data.newSubjectTag(tagname);
			Page.showSubject(Subject.id);
		}
		static onCancel() {
			Page.showSubject(Subject.id);
		}
	}

	export class Subject {
		static id:number = null;
		static openSection: string = 'none';

		static render(id:number=null){
			Page.pageName = Pages.Subject;
			if (id) { Subject.id = id; }
			else { id = Subject.id; }
			let subject = Model.Subject.read(id);
			subject.store(); // to update visited date

			let markup = "";
			markup += Page.generateElement('div',subject.name+' ('+subject.id+')');
			markup += Page.generateSubjectThumbnail(subject, "Page.Page.showGallery({subject:"+Subject.id+"})");
			let buttons = Page.generateElement('button','Gallery',{
				onclick:"Page.Page.showGallery({subject:"+Subject.id+"})"
			});
			buttons += Page.generateElement('button','Thumbnail',{onclick:"Page.Page.showSubjectThumb()"});
			buttons += Page.generateElement('button','Remove Subject',{onclick:"Page.Page.showConfirmRemoveSubject()"});
			markup += Page.generateElement('div',buttons,{class:'section'});

			markup += Subject.genTabButtons();
			markup += Subject.genVidsTab();
			markup += Subject.genTagsTab(subject);
			markup += Subject.genSitesTab();
			markup += Subject.genNewPicTab();

			Page.render(markup);
		}
		static genTabButtons(): string {
			let markup = Page.generateElement('button','vids',{
				onclick:'Page.Subject.onToggleSection("vids")',
				class: Subject.openSection === 'vids' ? 'selected' : '',
			});
			markup += Page.generateElement('button','tags',{
				onclick:'Page.Subject.onToggleSection("tags")',
				class: Subject.openSection === 'tags' ? 'selected' : '',
			});
			markup += Page.generateElement('button','sites',{
				onclick:'Page.Subject.onToggleSection("sites")',
				class: Subject.openSection === 'sites' ? 'selected' : '',
			});
			markup += Page.generateElement('button','new pic',{
				onclick:'Page.Subject.onToggleSection("newpic")',
				class: Subject.openSection === 'newpic' ? 'selected' : '',
			});
			return markup;
		}
		static genVidsTab(): string {
			let vidinput = Page.generateElement('input',null,{placeholder:'new vid',id:'new-vid'});
			let vidthumbinput = Page.generateElement('input',null,{placeholder:'new vid thumb',id:'new-vid-thumb'});
			let vidBtn = Page.generateElement('button','add vid',{onclick:'Page.Subject.onAddVid()'});
			let vidMarkup = Page.generateElement('div',vidinput+vidthumbinput+vidBtn,{class:'section'});
			let vids = Model.Vid.getVids(Subject.id);
			if (vids.length > 0) {
				let vidlinks = '';
				for (let vid of vids) {
					let thumbimg = Page.generateThumbnail({url:vid.thumburl});
					vidlinks += Page.generateElement('a',thumbimg,{target:'_blank',href:vid.url});
				}
				vidMarkup += Page.generateElement('div',vidlinks,{class:'section'});
			}
			let style = 'display:';
			style += Subject.openSection === 'vids' ? 'block;' : 'none;';
			return Page.generateElement('div',vidMarkup,{style:style});
		}
		static genTagsTab(subject: Model.Subject): string {
			let tagNames = Model.Data.subjectTags;
			let tagChecks = "";
			for (let name of tagNames) {
				let attributes = {type:'checkbox',value:name,class:'tagCheckbox'};
				if (subject.tags.indexOf(name) > -1) { attributes['checked'] = true; }
				let input = Page.generateElement('input',null,attributes);
				tagChecks += Page.generateElement('label',input+name,{class:'tag-check-wrapper'});
			}
			let checkboxes = Page.generateElement('div',tagChecks,{class:'tag-checkboxes'});
			let newtagbtn = Page.generateElement('button','New Tag',{onclick:'Page.Page.showNewSubjectTag()'});
			let tagMarkup = Page.generateElement('div',checkboxes+newtagbtn,{class:'section'});
			let style = 'display:';
			style += Subject.openSection === 'tags' ? 'block;' : 'none;';
			return Page.generateElement('div',tagMarkup,{style:style});
		}
		static genSitesTab(): string {
			let input = Page.generateElement('input',null,{placeholder:'new site',id:'new-site'});
			let siteBtn = Page.generateElement('button','add site',{onclick:'Page.Subject.onAddSite()'});
			let siteMarkup = Page.generateElement('div',input+siteBtn,{class:'section'});
			let siteData = Model.Data.query({type:'site',subject:Subject.id});
			let sitelinks = '';
			for (let site of siteData) {
				sitelinks += Page.generateElement('a',site.url,{href:site.url,target:'_blank'},{wrap:{}});
			}
			if (sitelinks) {
				siteMarkup += Page.generateElement('div',sitelinks,{class:'section'});
			}
			let style = 'display:';
			style += Subject.openSection === 'sites' ? 'block;' : 'none;';
			return Page.generateElement('div',siteMarkup,{style:style});
		}
		static genNewPicTab(): string {
			let newpicinput = Page.generateElement('input',null,{placeholder:'image url',id:'newpic-url'});
			let newpicbutton = Page.generateElement('button','submit',{onclick:'Page.Subject.onNewPic()'});
			let newpicmarkup = Page.generateElement('div',newpicinput+newpicbutton,{class:'section'});
			let style = 'display:';
			style += Subject.openSection === 'newpic' ? 'block;' : 'none;';
			return Page.generateElement('div',newpicmarkup,{style:style});
		}
		static getThumbData(subjectid){
			let subjectData = Model.Data.getEntry(subjectid);
			let thumbData = {};
			if (subjectData.thumb) {
				if (typeof subjectData.thumb === 'number') {
					thumbData = Model.Data.getEntry(subjectData.thumb);
				} else {
					thumbData = Model.Data.getEntry(subjectData.thumb.imageId);
					thumbData['marginx'] = subjectData.thumb.marginx;
					thumbData['marginy'] = subjectData.thumb.marginy;
					thumbData['maxwidth'] = subjectData.thumb.maxwidth;
				}
			} else {
				let images = Model.Data.query({type:'pic',subject:subjectData.id});
				if(images.length > 0){
					thumbData = images[0];
				}
			}

			return thumbData;
		}
		static onAddSite() {
			let input = <HTMLInputElement>document.getElementById('new-site');
			let url = input.value;
			let data = {
				type: "site",
				name: "site",
				url: url,
				subject: Subject.id,
			};
			Model.Data.newEntry(data);
			Subject.render(null);
		}
		static onAddVid() {
			let vidinput = <HTMLInputElement>document.getElementById('new-vid');
			let vidurl = vidinput.value;
			vidinput.value = '';
			let thumbinput = <HTMLInputElement>document.getElementById('new-vid-thumb');
			let thumburl = thumbinput.value;
			thumbinput.value = '';
			let data = {url:vidurl,thumburl:thumburl,subject:Subject.id};
			let vid = Model.Vid.init(data);
			vid.store();
			Subject.render();
		}
		static onNewPic() {
			let input:HTMLInputElement = <HTMLInputElement>document.getElementById('newpic-url');
			let url = input.value;
			let pic = new Model.Picture(url);
			pic.subjectid = Subject.id;
			pic.store();
			input.value = '';
		}
		static onSave() {
			let subject = Model.Subject.read(Subject.id);
			let boxes = document.getElementsByClassName('tagCheckbox');
			let checked = [];
			for (let box of boxes) {
				let element = <HTMLInputElement>box;
				if (element.checked) {
					if (subject.tags.indexOf(element.value) === -1) {
						subject.tags.push(element.value);
					}
				} else {
					let index = subject.tags.indexOf(element.value);
					if (index > -1) {
						subject.tags.splice(index,1);
					}
				}
			}
			subject.store();
		}
		static onToggleSection(name:string) {
			if (name === Subject.openSection) {
				Subject.openSection = 'none';
			} else { Subject.openSection = name; }
			Subject.render();
		}
	}

	export class SubjectFilter {
		static filterOn = false;
		static toggles: any;

		static render() {
			Page.pageName = Pages.SubjectFilter;
			if (!SubjectFilter.toggles) { SubjectFilter.updateToggles(); }
			let markup = Page.generateElement('div','subject filter');
			markup += Page.generateCheckbox('filter on', {
				name:'filterOn',id:'filterOn',onclick:'Page.SubjectFilter.onCheckbox()'
			}, SubjectFilter.filterOn);
			let toggles = Object.keys(SubjectFilter.toggles).sort();
			for (let toggle of toggles) {
				markup += Page.generateCheckbox(
					toggle, {
						name:toggle,onclick:'Page.SubjectFilter.onCheckbox()',class:'filterToggle'
					}, SubjectFilter.toggles[toggle]
				);
			}
			Page.render(markup);
		}

		static updateToggles() {
			let temp = SubjectFilter.toggles;
			if (!temp) { temp = {}; }
			SubjectFilter.toggles = {};
			for (let tag of Model.Data.subjectTags) {
				let on = temp.hasOwnProperty(tag) && temp[tag];
				SubjectFilter.toggles[tag]=false;
			}
		}

		static onCheckbox() {
			let filterOn = <HTMLInputElement>document.getElementById('filterOn');
			SubjectFilter.filterOn = filterOn.checked;
			for (let elem of document.getElementsByClassName('filterToggle')) {
				let checkbox = <HTMLInputElement>elem;
				SubjectFilter.toggles[checkbox.name] = checkbox.checked;
			}
		}
	}

	export class Subjects {
		static sortOrder = 'alpha';
		static alt = true;

		static render() {
			Page.pageName = Pages.Subjects;
			let markup = "";
			let options = Page.generateMenuOptions(['alpha','visited'],Subjects.sortOrder);
			markup += Page.generateElement('select',options,{id:'sort-order',onchange:'Page.Subjects.onSortOrder()'});
			markup += Page.generateElement('div',null,{id:'thumb-area'});
			Page.render(markup);
			Subjects.updateThumbs();
		}
		static updateThumbs() {
			let markup = "";
			let query = {type:'subject'};
			let unfiltered: Model.Subject[];

			if (Subjects.alt) {
				unfiltered = Model.Subject.getSubjectsWithTag('alt');
			}
			else {
				unfiltered = Model.Subject.getSubjectsWithoutTag('alt');
			}
			let subjects: Model.Subject[] = [];

			// apply filter
			if (SubjectFilter.filterOn) {
				for (let subject of unfiltered) {
					let subjectOk = true;
					for (let toggleName of Object.keys(SubjectFilter.toggles)) {
						if (SubjectFilter.toggles[toggleName]) {
							if (subject.hasTag(toggleName)) { subjectOk = false; continue; }
						}
					}
					if (subjectOk) { subjects.push (subject); }
				}
			} else {
				subjects = unfiltered;
			}

			// sort
			switch (Subjects.sortOrder) {
				case 'alpha': {
					subjects.sort((a,b) => a.name<b.name ? -1 : 1);
					break;
				}
				case 'visited': {
					subjects.sort((a,b) => a.visited<b.visited ? -1 : 1);
					break;
				}
			}

			// create thumbs
			for(let subject of subjects){
				markup += Page.generateSubjectThumbnail(subject);
			}
			let element = document.getElementById('thumb-area');
			element.innerHTML = markup;
		}
		static onClickSubject(id) {
			Page.showSubject(id);
		}
		static onSortOrder() {
			let orderMenu = <HTMLSelectElement>document.getElementById('sort-order');
			Subjects.sortOrder = orderMenu.value;
			Subjects.updateThumbs();
		}
		static toggleAltMode() {
			Subjects.alt = !Subjects.alt;
			Subjects.render();
		}
	}

	export class SubjectThumb {
		static subject: Model.Subject;
		static thumbObject: Model.Picture;
		static selectingul = false;
		static selectinglr = false;

		static render() {
			Page.pageName = Pages.Subjects;
			SubjectThumb.subject = Model.Subject.read(Subject.id);

			let imageObj = SubjectThumb.imageObject;
			let markup = Page.generateElement('div',null,{id:'workingBox'});
			let resultBox = Page.generateElement('div',null,{id:'resultBox'});
			let buttons = Page.generateElement('button','UpperLeft',{onclick:'Page.SubjectThumb.onBtnUpperLeft()'},{wrap:{}});
			buttons += Page.generateElement('button','LowerRight',{onclick:'Page.SubjectThumb.onBtnLowerRight()'},{wrap:{}});
			buttons += Page.generateElement('button','ChangeImage',{onclick:'Page.SubjectThumb.onBtnChangeImage()'},{wrap:{}});
			buttons += Page.generateElement('button','Apply',{onclick:'Page.SubjectThumb.onBtnApply()'},{wrap:{}});
			buttons += Page.generateElement('button','Cancel',{onclick:'Page.SubjectThumb.onBtnCancel()'},{wrap:{}});
			let style = `
				padding:10px;position:fixed;top:35;right:10;
				z-index:1;background-color:#555;
			`;
			markup += Page.generateElement('div',resultBox+buttons,{style:style});

			Page.render(markup);
			SubjectThumb.updateResult();
			SubjectThumb.updateWorkingImage();
		}
		static getImageId(): number {
			if (SubjectThumb.subject.hasOwnProperty('thumb')) {
				if (typeof SubjectThumb.subject.thumb === 'number') {
					return SubjectThumb.subject.thumb;
				}
				else {
					return SubjectThumb.subject.thumb.imageId;
				}
			}
			else {
				let ownImages = Model.Data.query({type:'pic',subject:SubjectThumb.subject.id});
				if (ownImages.length > 0) {
					return ownImages[0].id;
				} else { return null; }
			}
		}
		static get imageObject(): Model.Picture {
			return Model.Picture.read(SubjectThumb.subject.thumb.imageId);
		}
		static updateResult() {
			let thumbData = {
				subjectid: Subject.id,
				imageid: SubjectThumb.getImageId()
			};
			let img = Page.generateSubjectThumbnail(SubjectThumb.subject);

			let div = document.getElementById('resultBox');
			div.innerHTML = img;
		}
		static updateWorkingImage() {
			let markup = Page.generateElement(
				'img',null,{
					src:SubjectThumb.imageObject.url,id:'workingImage',
					// style:'max-width:'+SubjectThumb.subject.thumb.maxwidth+';',
					onclick:'Page.SubjectThumb.onclick()',
					onmousemove:'Page.SubjectThumb.onmousemove(event)'
				}
			);
			document.getElementById('workingBox').innerHTML=markup;
		}
		static onclick() {
			SubjectThumb.selectingul=false;
			SubjectThumb.selectinglr=false;
		}
		static onmousemove(event) {
			let mousex = event.offsetX;
			let mousey = event.offsetY;
			let workingImage = <HTMLImageElement>document.getElementById('workingImage');
			let scale = SubjectThumb.subject.thumb.maxwidth / workingImage.naturalWidth;
			if (SubjectThumb.selectingul) {
				SubjectThumb.subject.thumb.marginx = -mousex*scale;
				SubjectThumb.subject.thumb.marginy = -mousey*scale;

				SubjectThumb.updateResult();
			} else if (SubjectThumb.selectinglr) {
				let dist = Math.max(mousex,mousey);
				
				let unscaledmarginx = -SubjectThumb.subject.thumb.marginx / scale;
				let unscaledmarginy = -SubjectThumb.subject.thumb.marginy / scale;

				let distPercent = Math.min(dist / 200, 1);
				let newWidth = workingImage.naturalWidth * distPercent;
				scale = newWidth / workingImage.naturalWidth;

				SubjectThumb.subject.thumb.marginx = -unscaledmarginx*scale;
				SubjectThumb.subject.thumb.marginy = -unscaledmarginy*scale;

				SubjectThumb.subject.thumb.maxwidth = newWidth;
				SubjectThumb.updateResult();
				SubjectThumb.updateWorkingImage();
			}

		}
		static onBtnUpperLeft() {
			SubjectThumb.onclick();
			SubjectThumb.selectingul = true;
		}
		static onBtnLowerRight() {
			SubjectThumb.onclick();
			SubjectThumb.selectinglr = true;
		}
		static onBtnApply() {
			SubjectThumb.subject.store();
			Page.showSubject(Subject.id);
		}
		static onBtnCancel() {
			Page.showSubject(Subject.id);
		}
		static onBtnChangeImage(): void {
			Gallery.chooseSubjectThumb = true;
			Page.showGallery({subject:Subject.id});
		}
	}

}
