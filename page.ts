namespace Page {
	enum Pages {Debug,Gallery,Image,NewPic,Subject,Subjects};

	export class Page {
		static pageName: Pages = Pages.Debug;

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
			let names = ['Debug','Subjects'];
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
		
		static generateThumbnail(imageData, onclick=null) {
			let image = Page.generateElement('img',null,{src:imageData.url,style:'max-width:120;'});
			let thumb = Page.generateElement('div',image,{
				class:'thumb',
				style:'max-width:120;',
			});
			let attributes = {class:'subject-row'};
			if(onclick){ attributes['onclick']=onclick; }
			let markup = Page.generateElement('div',thumb,attributes);
			return markup;
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

	export class Gallery {
		static render(query:any) {
			Page.pageName = Pages.Gallery;
			
			query['type']='pic';
			let images = Model.Data.query(query);
			console.log('images',images);
			let markup = "";
			for (let image of images) {
				let onclick = 'Page.Page.showImage('+image.id+')';
				markup += Page.generateThumbnail(image,onclick);
			}
			Page.render(markup);
		}
	}

	export class Image {
		static id:number = null;

		static render(id:number) {
			Page.pageName = Pages.Image;
			
			Image.id = id;
			let imageData = Model.Data.getEntry(id);
			let markup = Page.generateElement('img',null,{src:imageData.url})
			Page.render(markup);
		}
	}

	export class Subject {
		static id:number = null;
		static render(id:number){
			Page.pageName = Pages.Subject;
			
			if (id) { Subject.id = id; }
			else { id = Subject.id; }
			let subject = Model.Data.getEntry(id);
			console.log('subject',subject);
			let markup = "";
			markup += Page.generateElement('div',subject.name);
			markup += Page.generateThumbnail(Subject.getThumbData(Subject.id));
			let button = Page.generateElement('button','Gallery',{
				onclick:"Page.Page.showGallery({subject:"+Subject.id+"})"
			});
			markup += Page.generateElement('div',button);
			button = Page.generateElement('button','New Pic',{onclick:"Page.Page.showNewPic()"});
			markup += Page.generateElement('div',button);

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
			let value = input.value;
			console.log('value',value);
		}
	}

	export class Subjects {
		static render() {
			Page.pageName = Pages.Subjects;
			let markup = "";
			let subjects = Model.Data.query({type:'subject'});
			for(let subject of subjects){
				let thumb = Subject.getThumbData(subject.id);
				let onclick = "Page.Subjects.onClickSubject("+subject.id+")";
				markup += Page.generateThumbnail(thumb,onclick);
			}
			Page.render(markup);
			Page.render(markup);
		}

		static onClickSubject(id) {
			Page.showSubject(id);
		}
	}

	export class ImageEdit {}
}
