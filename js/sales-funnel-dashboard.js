/**
 * A simple and easy to debug javascript file that handles the front end interface.
 *
 * I make no use of angular,react or even jQuery its pure old school javascript
 *
 * LMZ Feb 2017
 *
 * /

  /* TODO add templating files for embedded html */

/**
 * @description Generic handler for sidebar (menu) selection
 *
 * @param id - server id (from config.json)
 * @param type - either node,project,pod
 * @param optional - only used to pass the project name if type is project
 * @returns void
 */
function pageSelector(id, type, optional) {
  let el = document.getElementById('header-title');
  if (optional) {
    el.innerHTML = " SALES-FUNNEL-DASHBOARD <span style=\"color:white;padding-left:30px\">[ " + type + " " + optional + " ]</span>";
  } else {
    el.innerHTML = " SALES-FUNNEL-DASHBOARD <span style=\"color:white;padding-left:30px\">[ " + type + " ]</span>";
  }
  let nodes = document.getElementsByClassName("pageshow");
  for (let x = 0; x < nodes.length; x++) {
    nodes[x].className = "pageshow fade";
  }

  let page = document.getElementById(type + "-" + id + (optional ? '-' + optional : ''));
  // we check if the element exists
  if (page) {
    page.className = "pageshow";
  } else {
    let container = document.getElementById('main-container');
    let newDiv = document.createElement('div');
    newDiv.setAttribute("id", type + "-" + id + (optional ? '-' + optional : ''));
    newDiv.setAttribute("class", "pageshow");
    if (type === 'overview') {
      newDiv.innerHTML = buildRows(id);
      container.appendChild(newDiv);
    } else {
      newDiv.innerHTML = buildChannelView(id,optional);
      // this seems awkward to repeat but it allows the getting the canvas id to build the bar graph
      container.appendChild(newDiv);
      buildSingleBarGraph(iotdata.channels[0],100,optional);
    }
  }
  window.scrollTo(0, 0);
  currentPage = id;
  timerList = [];
  if (timer) clearInterval(timer);
}

/* Simple html include  - really do we need more commenting ? */
function includeHtml() {
  let contents = fs.readFileSync('header.html').toString();
  let header = document.getElementById('header');
  header.innerHTML = contents;
}


/* Build sidebar menu */

/**
 * @description Dynamic menu builder from config.json and cached files
 *
 */

function buildAll() {
  let sHtml = "";
  let sHtmlTable = "";
  filenames = fs.readdirSync('./funnels');
  filenames.forEach(file => {
    console.log(file);
    let rawdata = fs.readFileSync('./funnels/'+file);
    let contents = JSON.parse(rawdata);
    sHtmlTable += buildRows(file,contents);
  });

  //sMenu = "<ul class=\"sidebar-menu\" id=\"nav-accordion\">" + sHtml + "</ul>";
  //let el = document.getElementById('sidebar');
  //el.innerHTML = sMenu;

  let container = document.getElementById('main-container');
  let newDiv = document.createElement('div');
  newDiv.setAttribute("id", "funnel-data");
  newDiv.setAttribute("class", "pageshow");
  newDiv.innerHTML = "<section class=\"panel\">" +
    "<div class=\"panel-body progress-panel\">" +
    "  <div class=\"task-progress\">" +
    "    <h1>Sales Funnel Details</h1>" +
    "    <p></p>" +
    "  </div>" +
    "  <table class=\"table table-hover personal-task\">" +
    "  <thead style=\"text-align: center\"><tr><td><b>Market Group</b></td><td><b>Campaign</b></td><td><b>AdVariant</b></td><td><span><b>File</b></span></td><td><b>Status</td></thead>" +
    "  <tbody style=\"text-align: center; cursor: default\">" + sHtmlTable + "</tbody></table></div></section>";
  container.appendChild(newDiv);

}


/**
 * @description Simple menu toggle (expand and close)
 *
 * @param id - the element to check (clicked)
 * @return void
 *
 */
function toggleMenu(id) {
  let parent = document.getElementById('site'+id);
  let el = document.getElementById('sub-board'+id);
  if (parent.className.indexOf('active') >= 0) {
    el.style.display = "none";
    parent.className = "sub-menu";
  } else {
    el.style.display = "block";
    parent.className = "sub-menu active";
  }
}


function buildRows(file,json) {
  // we know that all comments should be present
  let sHtml = "";
  let mg = findComponentByReference("market-group",json);
  sHtml += "<tr><td>" + mg.name + "</td>";
  let campaign = findComponentByReference("utm_campaign",json);
  sHtml += "<td>"+ campaign.name +"</td>";
  let variant = findComponentByReference("utm_content",json);
  sHtml += "<td>"+ variant.name +"</td><td><span style=\"cursor: pointer\" onclick=\"javascript:loadDesigner('"+ file +"','" + variant.name +"');\" class=\"badge bg-important\">" + file + "</span></td><td><span id=\"" + variant.name+ "\"></td></tr>"; 
  return sHtml;
}

function findComponentByReference(ref,json) {
  let obj = {};
  json.components.forEach(component => {
    if (component.reference === ref) {
      obj = component
    }
  });
  return obj;
}

var selected = "";

function loadDesigner(name,id) {

  fs.copyFile('./funnels/'+name, '../totaljs/salesfunnel-flow/flow/designer.json', (err) => {
    console.log(err);
    if (err) throw err;
    log.info('file ' + name + ' was copied to destination');
    http.get('http://127.0.0.1:8000/api/reload', (resp) => {
      let data = '';

      // A chunk of data has been received.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        console.log(data);
        window.open('http://127.0.0.1:8000/#designer-ssu','designer','toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1800,height=1100');
        if (selected !== id) {
          el = document.getElementById(id);
          el.className = "badge bg-primary";
          el.innerHTML = "selected";
          if (selected !== "") {
            ns = document.getElementById(selected);
            ns.className = "";
            ns.innerHTML = "";
          }
          selected = id;
        }
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  });
}

