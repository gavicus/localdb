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
			if(content.hasOwnProperty('id') && content.id){
				return Data.updateEntry(content);
			}
			else {
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
			return {type: 'pic', url: this.url, subject: this.subjectid, id:this.id};
		}

		store(): void {
			let data = Model.Data.store(this.data);
			this.id = data.id;
		}
		
		static read(id:number): Picture {
			return Picture.initFromData(Model.Data.getEntry(id));
		}

		static getSubjectPics(subjectid: number): Picture[] {
			let pics: Picture[] = [];
			let data = Data.query({type:'pic',subject:subjectid});
			for (let entry of data) {
				pics.push(Picture.initFromData(entry));
			}
			return pics;
		}

		static initFromData(data:any): Picture {
			let pic = new Picture(data.url);
			pic.id = data.id;
			pic.subjectid = data.subject;
			return pic;
		}

	}

	export class Subject {
		public type = 'subject';
		public thumb: any;
		public id: number;
		public name: string;
		public visited: Date;
		public tags: string[] = [];

		constructor(name: string) {
			this.name = name;
		}

		static read(id: number): Subject {
			let data = Model.Data.getEntry(id);
			return Subject.initFromData(data);
		}

		static initFromData(data:any): Subject {
			let subject = new Subject(data.name);
			subject.id = data.id;
			subject.name = data.name;
			subject.thumb = data.thumb;

			if (typeof subject.thumb === 'undefined') {
				let pics = Picture.getSubjectPics(subject.id);
				if (pics.length > 0) {
					subject.setThumb(pics[0].id);
				}
			}
			else if (typeof subject.thumb === 'number') {
				subject.setThumb(subject.thumb);
			}
			if (data.hasOwnProperty('visited')) {
				subject.visited = new Date(data.visited);
			} else {
				subject['visited'] = new Date();
			}

			if (data.hasOwnProperty('tags')) {
				subject.tags = data.tags;
			} else {
				subject.tags = [];
			}

			return subject;
		}

		static getSubjects(): Subject[] {
			let data: any[] = Data.query({type:'subject'});
			let subjects: Subject[] = [];
			for (let datum of data) {
				subjects.push(Subject.initFromData(datum));
			}
			return subjects;
		}

		static getSubjectsWithTag(tag: string): Subject[] {
			let data: any[] = Data.query({type:'subject'});
			let subjects: Subject[] = [];
			for (let datum of data) {
				let s = Subject.initFromData(datum);
				if (s.hasTag(tag)) {
					subjects.push(Subject.initFromData(datum));
				}
			}
			return subjects;
		}

		static getSubjectsWithoutTag(tag: string): Subject[] {
			let data: any[] = Data.query({type:'subject'});
			let subjects: Subject[] = [];
			for (let datum of data) {
				let s = Subject.initFromData(datum);
				if (!s.hasTag(tag)) {
					subjects.push(Subject.initFromData(datum));
				}
			}
			return subjects;
		}

		public hasTag(name: string): boolean {
			return this.tags.indexOf(name) > -1;
		}

		public setTag(name: string): void {
			if (this.hasTag(name)) { return; }
			this.tags.push(name);
		}
		
		public setThumb(imageId:number) {
			this.thumb = { imageId:imageId, marginx:0, marginy:0, maxwidth:Page.Page.thumbOuter };
		}

		public store(): void {
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

	export class Vid {
		public type = 'vid';
		public id:number;
		public url: string;
		public thumburl: string;
		public subject: number;

		public static getVids(subjectid:number): Vid[] {
			let vids: Vid[] = [];
			let data = Data.query({type:'vid', subject:subjectid});
			for (let entry of data) {
				vids.push(Vid.init(entry));
			}
			return vids;
		}

		public static init(data: any) {
			let vid = new Vid();
			vid.id = data.id;
			vid.url = data.url;
			vid.thumburl = data.thumburl;
			vid.subject = data.subject;
			return vid;
		}
		
		store(): void {
			let data = {
				type:'vid',id:this.id,url:this.url,
				thumburl:this.thumburl,subject:this.subject
			};
			data = Model.Data.store(data);
			this.id = data.id;
		}
		
	}
}