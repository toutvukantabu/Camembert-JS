function stringToDom(str) {
    return document.createRange().createContextualFragment(str).firstChild;
}
// function d'acceleration de l'animation du donut
function  easeOutExpo(x){
return x === 1 ? 1 : 1 - Math.pow(2, -10 * x)

}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    toSvgPath() {
        return `${this.x} ${this.y}`;
    }

    static fromAngle(angle) {
        return new Point(Math.cos(angle), Math.sin(angle));
    }
}

/**
 * @property{number[]} data
 * @property{SVGpathElement[]}paths
 */
class PieChart extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({
            mode: "open"
        });
        const donut = this.getAttribute('donut') ?? '0.0057'
        const colors = [
            "#FAAA32",
            "#3EFA7D",
            "#FA6A25",
            "#0C94FA",
            "#FA1F19",
            "#0CFAE2",
            "#AB6D23"
        ];
        this.data = this.getAttribute("data").split(";").map(v => parseFloat(v));
        const svg = stringToDom(`<svg viewBox = "-1 -1 2 2">
        <g  class= "pathGroup" mask="url(#graphMask)">
        </g>  
    <mask class = "maskGroup" id="graphMask">
    <rect fill = "white" x="-1" y="-1" width = "2" height="2"/>
    <circle r="0${donut}" fill = "black"/>
    </mask>
        </svg>`);
        const pathGroup = svg.querySelector('g');
        const maskGroup = svg.querySelector('mask');
        const gap = this.getAttribute('gap') ?? '0.015';
        // on cree nos chemins
        this.paths = this.data.map((_, k) => {
            const color = colors[k % (colors.length - 1)];
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", color);
            pathGroup.appendChild(path);
            return path;
        });
        this.lines = this.data.map((_, k) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("stroke", '#000');
            line.setAttribute("stroke-width", gap);
            line.setAttribute("x1", '0');
            line.setAttribute("y1", '0');
            maskGroup.appendChild(line);
            return line;
        })
        const style = document.createElement('style');
        style.innerHTML = `
        :host {
            display: block;
            position : relative;
        }
        svg {
            width : 100%;
            height: 100%;
        }
        path{
            cursor: pointer;
            transition: opacity .3s;
        } 
        path:hover{
            opacity: 0.5;
        }`
        shadow.appendChild(style)
        shadow.appendChild(svg);
    }

    connectedCallback() {
        const now = Date.now()
        const duration = 1000
        const draw = () => {
            const t = (Date.now() - now) / duration
            if (t < 1) {
                this.draw(easeOutExpo(t))
                window.requestAnimationFrame(draw)
            } else {
                this.draw(1);
            }
        }
        window.requestAnimationFrame(draw)
    }

    draw(progress = 1) {
        const total = this.data.reduce((acc, v) => acc + v, 0);
        let angle = Math.PI / -2;
        let start = new Point(0,-1);
        for (let k = 0; k < this.data.length; k++) {
            this.lines[k].setAttribute('x2', start.x)
            this.lines[k].setAttribute('y2', start.y)
            const ratio = this.data[k] / total * progress;
            angle += ratio * 2 * Math.PI;
            const end = Point.fromAngle(angle);
            const largeFlag = ratio > 0.5 ? '1' : '0';
            this.paths[k].setAttribute("d", `M 0 0 L ${start.toSvgPath()} A 1 1 0 ${largeFlag} 1 ${end.toSvgPath()} L 0 0 `);
            start = end;
        }
    }
}
customElements.define("pie-chart", PieChart);