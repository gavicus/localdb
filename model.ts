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

		static get toc(): any {
			let toc = localStorage.toc;
			if(toc){ return JSON.parse(toc); }
			else { return this.initToc(); }
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
			if(content.hasOwnProperty('id')){
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
	}

	export class Picture {
		public type = 'pic';
		public id:number;
		public url: string;

		constructor(url:string) {
			this.url = url;
		}

		static read(id:number): Picture {
			let data = Model.Data.getEntry(id);
			let pic = new Picture(data.url);
			pic.id = data.id;
			return pic;
		}
	}
}