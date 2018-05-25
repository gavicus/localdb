namespace Model {
	export class Data {
		static g = true;
		
		static initToc(): any {
			let toc = {
				lastId: 0,
				ids: [],
			};
			let jtoc = JSON.stringify(toc);
			localStorage.setItem('toc', jtoc);
			return toc;
		}

		static initSubjectTags(): any {
			let tags = [];
			let jtags = JSON.stringify(tags);
			localStorage.setItem('subjectTags', jtags);
			return tags;
		}

		static newSubjectTag(tagname): void {
			let tags = Data.subjectTags;
			if (tags.indexOf(tagname) === -1) {
				tags.push(tagname);
				localStorage.setItem('subjectTags', JSON.stringify(tags));
			}
		}

		static get toc(): any {
			let toc = localStorage.toc;
			if(toc){ return JSON.parse(toc); }
			else { return this.initToc(); }
		}

		static get subjectTags(): any {
			let tags = localStorage.subjectTags;
			if (tags) { return JSON.parse(tags); }
			else { return this.initSubjectTags(); }
		}

		static get entryTypes(): string[] {
			let types = [];
			for(let id of Data.toc.ids){
				let entry = Data.getEntry(id);
				if (types.indexOf(entry.type)===-1) { types.push(entry.type); }
			}
			return types;
		}

		static getEntry (id): any {
			let entry = localStorage.getItem(id);
			if(entry){ return JSON.parse(entry); }
			else { return null; }
		}

		static query (q): any {
			let toc = Data.toc;
			let result = [];
			for(let id of toc.ids){
				let entry = Data.getEntry(id);
				let ok = true;
				for(let key of Object.keys(q)){
					if(entry[key] !== q[key]){
						ok = false;
						break;
					}
				}
				if(ok){ result.push(entry); }
			}
			return result;
		}

		static store(content){
			console.log('Model.Data.store',content);
			console.log('content.id',content.id);
			console.log('content.name',content.name);
			if(content.hasOwnProperty('id')){
				console.log('updateEntry');
				return Data.updateEntry(content);
			}
			else {
				console.log('newEntry');
				return Data.newEntry(content);
			}
		}
		static newId(){
			let toc;
			let jtoc = localStorage.getItem('toc');
			if(jtoc){
				toc = JSON.parse(jtoc);
			} else { toc = Data.initToc(); }
			toc.lastId += 1;
			toc.ids.push(toc.lastId);
			jtoc = JSON.stringify(toc);
			localStorage.setItem('toc', jtoc);
			return toc.lastId;
		}
		static newEntry(content){
			content.id = Data.newId();
			localStorage.setItem(content.id, JSON.stringify(content));
			return content;
		}
		static updateEntry(content){
			localStorage.setItem(content.id, JSON.stringify(content));
			return content;
		}
		static removeEntry(id) {
			localStorage.removeItem(id);
			let toc = this.toc;
			toc.ids.splice(toc.ids.indexOf(id),1);
			let jtoc = JSON.stringify(toc);
			localStorage.setItem('toc',jtoc);
		}
	}

	export class Picture {
		public type = 'pic';
		public id:number;
		public url: string;
		public subjectid: number;

		constructor(url:string) {
			this.url = url;
		}

		public get data(): any {
			return {type: 'pic', url: this.url, subject: this.subjectid};
		}

		store(): void {
			let data = Model.Data.store(this.data);
			this.id = data.id;
		}
		
		static read(id:number): Picture {
			return Picture.initFromData(Model.Data.getEntry(id));
		}

		static initFromData(data:any): Picture {
			let pic = new Picture(data.url);
			pic.id = data.id;
			return pic;
		}

	}

	export class Subject {
		public type = 'subject';
		public thumb: any;
		public id: number;
		public visited: Date;
		public tags: string[] = [];

		constructor(public name: string) {}

		static read(id: number): Subject {
			let data = Model.Data.getEntry(id);
			return Subject.initFromData(data);
		}
		
		static initFromData(data:any): Subject {
			let subject = new Subject(data.name);
			subject.thumb = data.thumb;
			if (typeof subject.thumb === 'number') {
				subject.setThumb(data.thumb);
			}
			subject.id = data.id;
			if (data.hasOwnProperty('visited')) {
				subject.visited = new Date(data.visited);
			}
			if (data.hasOwnProperty('tags')) {
				subject.tags = data.tags;
			} else {
				subject.tags = [];
			}
			return subject;
		}

		setThumb(imageId:number) {
			this.thumb = { imageId:imageId, marginx:0, marginy:0, maxwidth:120 };
		}

		store(): void {
			this.visited = new Date();
			let content = {
				type: this.type,
				name: this.name,
				thumb: this.thumb,
				visited: this.visited.toJSON(),
				tags: this.tags,
			};
			if (this.id) { content['id'] = this.id; }
			let response = Model.Data.store(content);
			this.id = response.id;
		}
	}
}