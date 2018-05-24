namespace Page {
	enum Pages {ConfirmRemoveSubject,Debug,EditImage,Gallery,Image,NewPic,NewSubject,NewSubjectTag,Subject,Subjects};

	export class Page {
		static pageName: Pages = Pages.Debug;

		static showDebug() { Debug.render(); }
		static showSubjects() { Subjects.render(); }
		static showSubject(id) { Subject.render(id); }
		static showGallery(query) { Gallery.render(query); }
		static showImage(id) { Image.render(id); }
		static showNewPic() { NewPic.render(); }
		static showNewSubject() { NewSubject.render(); }
		static showEditImage() { EditImage.render(); }
		static showConfirmRemoveSubject() { ConfirmRemoveSubject.render() }
		static showNewSubjectTag() { NewSubjectTag.render() }

		static render(markup) {
			let menu = Page.generateMenu();
			document.getElementById('page-area').innerHTML = menu + markup;
		}

		static generateMenu() {
			let links = "";
			let names = ['Debug','Subjects'];
			if (Page.pageName === Pages.Subjects) { names.push('NewSubject'); }
			if (Page.pageName === Pages.Image) { names.push('EditImage'); }
			for (let name of names) {
				links += Page.generateElement('a',name,{onclick:'Page.Page.show'+name+'()'});
			}
			return "<div class='links'>"+links+"</div>";
		}

		static generateElement(tag:string, inner:string, attributes:any={}, options:any={}) {
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

		static generateMenuOptions(names) {
			let options = "";
			for (let name of names) {
				options += Page.generateElement('option',name,{value:name});
			}
			return options;
		}
		
		static generateThumbnail(imageData, onclick=null, tooltip=null) {
			let image = imageData
				? Page.generateElement('img',null,{src:imageData.url,style:'max-width:120;'})
				: '';
			let thumb = Page.generateElement('div',image,{
				class:'thumb',
				style:'max-width:120;',
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
			let message = 'Really remove subject ' + subject.name;
			let markup = Page.generateElement('div',message);
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
			markup += Page.generateElement('div','subject: '+subject.name);
			markup += Page.generateElement('button','remove image',{onclick:"Page.EditImage.onRemove()"});
			Page.render(markup);
		}
		static onRemove() {
			Model.Data.removeEntry(EditImage.imageId);
			Page.showGallery({subject:Subject.id});
		}
	}

	export class Gallery {
		static images: any[];

		static render(query:any) {
			Page.pageName = Pages.Gallery;
			query['type']='pic';
			Gallery.images = Model.Data.query(query);
			let markup = "";
			for (let image of Gallery.images) {
				let onclick = 'Page.Page.showImage('+image.id+')';
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
		static render(id:number){
			Page.pageName = Pages.Subject;
			
			if (id) { Subject.id = id; }
			else { id = Subject.id; }
			let subject = Model.Subject.read(id);
			subject.store(); // to update visited date
			let markup = "";
			markup += Page.generateElement('div',subject.name);
			markup += Page.generateThumbnail(Subject.getThumbData(Subject.id));
			let buttons = Page.generateElement('button','Gallery',{
				onclick:"Page.Page.showGallery({subject:"+Subject.id+"})"
			});
			buttons += Page.generateElement('button','New Pic',{onclick:"Page.Page.showNewPic()"});
			buttons += Page.generateElement('button','Remove Subject',{onclick:"Page.Page.showConfirmRemoveSubject()"});
			markup += Page.generateElement('div',buttons);

			let tagNames = Model.Data.subjectTags;
			let tagChecks = "";
			for (let name of tagNames) {
				let attributes = {type:'checkbox',value:name,class:'tagCheckbox'};
				if (subject.tags.indexOf(name) > -1) { attributes['checked'] = true; }
				let input = Page.generateElement('input',null,attributes);
				tagChecks += Page.generateElement('label',input+name);
			}
			markup += Page.generateElement('div',tagChecks,{class:'tag-checkboxes'});
			markup += Page.generateElement('button','Save',{onclick:'Page.Subject.onSave()'},{wrap:{}});
			markup += Page.generateElement('button','New Tag',{onclick:'Page.Page.showNewSubjectTag()'},{wrap:{}});

			Page.render(markup);
		}
		static getThumbData(subjectid){
			let subjectData = Model.Data.getEntry(subjectid);
			let thumbData = Model.Data.getEntry(subjectData.thumb);
			if(!thumbData){
				let images = Model.Data.query({type:'pic',subject:subjectData.id});
				if(images.length > 0){ thumbData = images[0]; }
			}
			return thumbData;
		}
		static onSave() {
			console.log('Subject.onSave');
			let subject = Model.Subject.read(Subject.id);
			let boxes = document.getElementsByClassName('tagCheckbox');
			let checked = [];
			for (let box of boxes) {
				let element = <HTMLInputElement>box;
				console.log('box',element.value,element.checked);
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
			subject.store();
			Page.showSubject(subject.id);
		}
		static onCancel() {
			Page.showSubjects();
		}
	}

	export class Subjects {
		static render() {
			Page.pageName = Pages.Subjects;
			let markup = "";
			let options = Page.generateMenuOptions(['alpha','visited']);
			markup += Page.generateElement('select',options,{id:'sort-order',onchange:'Page.Subjects.onSortOrder()'});
			markup += Page.generateElement('div',null,{id:'thumb-area'});

			Page.render(markup);
			Subjects.updateThumbs();
		}

		static updateThumbs() {
			let markup = "";
			let subjects = Model.Data.query({type:'subject'});

			let orderMenu = <HTMLSelectElement>document.getElementById('sort-order');
			let order = orderMenu.value;
			switch (order) {
				case 'alpha': {
					subjects.sort((a,b) => a.name<b.name ? -1 : 1);
					break;
				}
				case 'visited': {
					subjects.sort((a,b) => a.visited<b.visited ? -1 : 1);
					break;
				}
			}

			for(let subject of subjects){
				let thumb = Subject.getThumbData(subject.id);
				let onclick = "Page.Subjects.onClickSubject("+subject.id+")";
				markup += Page.generateThumbnail(thumb,onclick,subject.name);
			}
			let element = document.getElementById('thumb-area');
			element.innerHTML = markup;
		}

		static onClickSubject(id) {
			Page.showSubject(id);
		}

		static onSortOrder() {
			Subjects.updateThumbs();
		}
	}

	export class ImageEdit {}
}
