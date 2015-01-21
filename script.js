d3.json("associations.json", function(error, graph) {
	if (error) return console.warn(error);

	var color = d3.scale.ordinal()
	    .domain(["Issue", "Actor", "Resource", "Solution"])
	    .range(['#127EB2', '#FF1932', '#00ABFF', '#CCC614']);

	var width = window.innerWidth;
	var height = window.innerHeight;
	var r = 6;

	function dblclick(d) {
	  d3.select(this).classed("fixed", d.fixed = false);
	}

	function dragstart(d) {
	  d3.select(this).classed("fixed", d.fixed = true);
	}

	function redraw() {
		svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
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

	function release_all() {
		console.log("asdas")
		d3.selectAll(".node").classed("fixed", function(d) { return d.fixed = false; });
	}

	function tick() {
		link.attr("x1", function(d) { return d.source.x })
			.attr("y1", function(d) { return d.source.y })
			.attr("x2", function(d) { return d.target.x })
			.attr("y2", function(d) { return d.target.y });

		node.attr("cx", function(d) { return d.x = Math.max(r, Math.min(width - r, d.x)); })
			.attr("cy", function(d) { return d.y = Math.max(r, Math.min(height - r, d.y)); });

		linkNode.attr("cx", function(d) { return d.x = (d.source.x + d.target.x) * 0.5; })
        		.attr("cy", function(d) { return d.y = (d.source.y + d.target.y) * 0.5; });
	}

	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	};

	var nodeMap = {};
	var frozen = false;
	var linkNodes = [];

	graph.nodes.forEach(function(d) { nodeMap[d.node] = d; });

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
	    .charge(-100)
	    .gravity(.03)
	    .linkDistance(400);

	var svg = d3.select("#graph")
		.append("svg:svg")
		.attr("width", width)
		.attr("height", height)
		.attr("pointer-events", "all")
		.append('svg:g')
		.call(d3.behavior.zoom().on("zoom", redraw))
		.append('svg:g');


	var background = svg.append("rect")
		.attr("fill", "none")
		.on("dblclick", release_all)

	force = d3.layout.force()
		.nodes(graph.nodes.concat(linkNodes))
		.links(graph.links)
		.size([width, height])
		.start();

	resize();
	d3.select(window).on("resize", resize);

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
		.attr("r", r)
		.style("stroke", function(d) { return color(d.group); })
		.style("stroke-width", 2)
		.style("fill", "#fff")
		.on("dblclick", double_click)
		.call(node_drag);

	var linkNode = svg.selectAll(".link-node")
		.data(linkNodes)
		.enter().append("circle")
		.attr("class", "link-node")
		.attr("r", 0)
		.style("fill", "#ccc");

	var linkedByIndex = {};
	graph.links.forEach(function(d) {
		linkedByIndex[d.source.index + "," + d.target.index] = 1;
	});

	function neighboring(a, b) {
		return linkedByIndex[a.index + "," + b.index];
	}

	function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

	node.on("click", function(d) {
		if (d3.event.defaultPrevented) return;
		frozen = true;
		d3.selectAll('.node')
			.attr('class', 'node')
			.attr('r', r)
			.style('fill', '#fff')
			.style('stroke', function(d) { return color(d.group); })
			.style('fill-opacity', 1)
			.style('stroke-opacity', .5);
		d3.select(this)
			.attr('class', "node active-node")
			.attr('r', r*2)
			.style('fill', function(d) { return color(d.group); })
			.style('fill-opacity', 1)
			.style('stroke-opacity', 1)
			.style('stroke', "#000")
			.moveToFront();
		link.style("stroke", function(o) {
				return o.source === d || o.target === d ? "#000" : "#999";
			}).style("stroke-width", function(o) {
				return o.source === d || o.target === d ? 2 : 1;
			});
		node.style("fill", function(o) {
			return isConnected(d, o) ? color(o.group) : "#fff";
		}).style("stroke", function(o) {
			return isConnected(d, o) ? "#000" : color(o.group);
		}).style("stroke-opacity", function(o) {
			return isConnected(d, o) ? 1 : .5;
		}).classed("selected-node", function(o) {
			return isConnected(d, o) ? true : false;
		}).filter(function(o) {
			return isConnected(d,o) ? this : null;
		}).moveToFront();
		$('#node_name').text(d.name);
		$('#node_description').text(d.description);
		$('#related_node_name').text('');
		$('#related_node_description').text('');
	});

	node.on("mouseover", function(d) {
		if (!frozen) {
			$('#node_name').text(d.name);
			$('#node_description').text(d.description);
			$('#node_info').css('border-color', $(this).css('stroke'));
			d3.select(this).style('stroke', "#000");
		}
		if (frozen && this.classList.contains('selected-node') && !this.classList.contains('active-node')) {
			$('#related_node_name').text(d.name);
			$('#related_node_description').text(d.description);
			$('#related_node_info').css('border-color', $(this).css('fill'));
		}
	});

	node.on("mouseout", function(d) {
		if (!frozen) {
			d3.selectAll('.node').style('stroke', function(d) { return color(d.group); });
		}
	})

	background.on('click', function(d) {
		frozen = false;
		d3.selectAll('.node')
			.attr('class', 'node')
			.attr('r', r)
			.style('stroke', function(d) { return color(d.group); })
			.style('fill-opacity', 1)
			.style('stroke-opacity', 1)
			.style('fill', '#fff');
		link.style('stroke', "#999")
			.style('stroke-width', 1);
		$('#node_name').text('');
		$('#node_description').text('');
		$('#node_info').css('border-color', "#000");
		$('#related_node_name').text('');
		$('#related_node_description').text('');
		$('#related_node_info').css('border-color', "#000");
	});

	var nodeTitles = node.append("title")
		.text(function(d) { return d.name; });

	force.on("tick", tick);

	function resize() {
		width = $('#graph').width();
		height = $('#graph').height();
		svg.attr("width", width)
			.attr("height", height);
		background.attr("width", width)
			.attr("height", height);
		force.size([width, height])
			.resume();
	}

	

});
