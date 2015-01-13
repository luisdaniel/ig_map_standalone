d3.json("associations.json", function(error, graph) {
	if (error) return console.warn(error);

	var color = d3.scale.ordinal()
	    .domain(["Issue", "Actor", "Resource", "Solution"])
	    .range(['#127EB2', '#FF1932', '#00ABFF', '#CCC614']);

	function updateWindow(){
	    x = w.innerWidth || e.clientWidth || g.clientWidth;
	    y = w.innerHeight|| e.clientHeight|| g.clientHeight;

	    svg.attr("width", x).attr("height", y);
	}
	window.onresize = updateWindow;

	function dblclick(d) {
	  d3.select(this).classed("fixed", d.fixed = false);
	}

	function dragstart(d) {
	  d3.select(this).classed("fixed", d.fixed = true);
	}


	function redraw() {
	  svg.attr("transform",
	      "translate(" + d3.event.translate + ")"
	      + " scale(" + d3.event.scale + ")");
	}

	function dragstart(d, i) {
	    force.stop() 
	}

	function dragmove(d, i) {
	    d.px += d3.event.dx;
	    d.py += d3.event.dy;
	    d.x += d3.event.dx;
	    d.y += d3.event.dy; 
	    tick(); 
	}

	function dragend(d, i) {
	    d.fixed = true; 
	    tick();
	    force.resume();
	}

	function double_click(d, i) {
		d.fixed = false;
	}

	function tick() {
		link.attr("x1", function(d) { return w/2 + d.source.x; })
			.attr("y1", function(d) { return h/2 + d.source.y; })
			.attr("x2", function(d) { return w/2 + d.target.x; })
			.attr("y2", function(d) { return h/2 + d.target.y; });

		node.attr("cx", function(d) { return w/2 + d.x; })
			.attr("cy", function(d) { return h/2 + d.y; });

		linkNode.attr("cx", function(d) { return d.x = (d.source.x + d.target.x) * 0.5; })
        		.attr("cy", function(d) { return d.y = (d.source.y + d.target.y) * 0.5; });
	}

	var w = window,
	    d = document,
	    e = d.documentElement,
	    g = $('#graph')[0],
	    x = w.innerWidth || e.clientWidth || g.clientWidth,
	    y = w.innerHeight|| e.clientHeight|| g.clientHeight;


	var w = $('#graph').width();
	var h = $('#graph').height();

	var nodeMap = {};
	var frozen = false;
	var linkNodes = [];

	graph.nodes.forEach(function(d) { nodeMap[d.node] = d; });
	console.log(nodeMap)

	graph.links.forEach(function(l) {
	    linkNodes.push({
			source: nodeMap[l.source],
			target: nodeMap[l.target]
		});
	});

	graph.links.forEach(function(l) {
	    l.source = nodeMap[l.source];
	    l.target = nodeMap[l.target];
	});

	var force = d3.layout.force()
	    .charge(-120)
	    .gravity(.05)
	    .linkDistance(200)
	    .size([w, h]);

	var svg = d3.select("#graph").append("svg:svg")
	    .attr("width", x)
	    .attr("height", y)
	    .append('svg:g')
	    .attr("pointer-events", "all")
	    //.call(d3.behavior.zoom().on("zoom", redraw))
	    .append('svg:g');

	var background = svg.append("rect")
		.attr("width", w)
		.attr("height", h)
		.attr("fill", "#fff");

	force = d3.layout.force()
	      .nodes(graph.nodes.concat(linkNodes))
	      .links(graph.links)
	      .start();

	var link = svg.selectAll(".link")
		.data(graph.links)
		.enter().append("line")
		.attr("class", "link")
		.style("stroke-width", 1);

	var node_drag = d3.behavior.drag()
	    .on("dragstart", dragstart)
	    .on("drag", dragmove)
	    .on("dragend", dragend);

	var node = svg.selectAll(".node")
		.data(graph.nodes)
		.enter().append("circle")
		.attr("class", "node")
		.attr("r", 5)
		.style("fill", function(d) { return color(d.group); })
		.on("dblclick", double_click)
		.call(node_drag);

	var linkNode = svg.selectAll(".link-node")
		.data(linkNodes)
		.enter().append("circle")
		.attr("class", "link-node")
		.attr("r", 0)
		.style("fill", "#ccc");

	node.on("click", function(d) {
		if (d3.event.defaultPrevented) return;
		frozen = true;
		d3.selectAll('.node').attr('class', 'node')
		d3.selectAll('.node').attr('r', 5);
		d3.select(this).attr('class', "node active-node");
		d3.select(this).attr('r', 10);
		$('#node_name').text(d.name);
		$('#node_description').text(d.description);
	});

	node.on("mouseover", function(d) {
		if (!frozen) {
			$('#node_name').text(d.name);
			$('#node_description').text(d.description);
		}
	});

	background.on('click', function(d) {
		frozen = false;
		d3.selectAll('.node').attr('class', 'node')
		d3.selectAll('.node').attr('r', 5);
		$('#node_name').text('');
		$('#node_description').text('');
	});

	var nodeTitles = node.append("title")
		.text(function(d) { return d.name; });

	force.on("tick", tick);

});
