export class System {
    constructor (canvas, actors, representations, timeline) {
        this.canvas = canvas;
        this.actors = actors;
        this.timeline = timeline;
        this.representations = representations;
        this.definitions = {};
    }
    add_actor (actor) {
        actor.set_system(this);
        this.actors.push(actor);
    }
    add_representation (name, representation) {
        this.representations[name] = representation;
    }
    load_representations(molecule_types) {
        return Promise.all(
            molecule_types.map(x=>
                fetch(x['svg_path'])
                    .then(resp=>resp.text())
                    .then(str=>this.add_representation(x['name'],str)
                ))
        );
    }
    define_rep(rep_name) {
        let s = this.canvas.symbol();
        let def = s.svg(this.representations[rep_name]);
        this.definitions[rep_name] = def;
    }
    define_reps() {
        return Promise.all(Object.keys(this.representations).map(x=>this.define_rep(x)));
    }
}

export class Actor {
    constructor (source, enabled, parent) {
        this.source = source;
        this.enabled = enabled;
        this.parent = parent;
        this.system = null;
        this.enabled = false;
    }
    enable() { 
        this.enabled = true;
    }
    disable() { 
        this.enabled = false;
    }
    set_parent(parent) { 
        this.parent = parent;
    }
    set_system(system) {
        this.system = system;
    }
}

export class Molecule extends Actor {
    constructor (source, name, components, parent) {
        super(source, parent);
        this.name = name;
        this.components = components;
    }
    add_component (component) {
        this.components.push(component);
    }
}

export class Component extends Actor {
    constructor (source, name, states, current_state, parent) {
        super(source, parent);
        this.name = name;
        this.states = states;
        this.current_state = current_state;
    }
    add_state (state) {
        this.states.push(state);
        state.set_parent(this);
    }
    set_state (state) {
        this.current_state = state;
    }
    render_self () {
        console.log("rendering component");
        this.current_state.render();
    }
}

export class ComponentState extends Actor {
    constructor (source, name, parent) {
        super(source, parent);
        this.name = name;
    }
}

export class Settings {
    constructor (setting_file) {
        this.setting_file = setting_file;
        this.system = null;
    }
    async parse_settings_file() {
        let settings_json = await fetch(this.setting_file).then(setting=>setting.json());
        // initialize system
        let vis_settings = settings_json['visualization_settings'];
        let w=vis_settings['general']['width'],h=vis_settings['general']['height'];
        let timeline = new SVG.Timeline();
        let canvas = SVG().addTo('body').size(window.innerWidth, window.innerHeight).viewbox(0, 0, w, h);
        let sys = new System(canvas, [], {}, timeline);
        // pull visualization settings out and initialize molecule types
        await sys.load_representations(vis_settings['molecule_types']);
        await sys.define_reps();
        // return initialized system
        this.system = sys;
    }
}