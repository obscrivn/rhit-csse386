const DAYS_AS_CHARS = "UMTWRFS";

const MODE_MAP = {
  'panopto': {
    'src': './images/panopto.png',
    'alt': 'Panopto Recorded Lesson(s)'
  },
  'teams': {
    'src': './images/teams.png',
    'alt': 'Microsoft Teams Live Lesson(s)'
  },
  'classroom': {
    'src': './images/classroom.png',
    'alt': 'In-Person Classroom Meeting'
  }
};

var Schedule = function () {
  function Week(num) {
    this.label = "Week " + num;
    this.days = [];
  }
  Week.prototype = {
    appendDay: function (day) {
      this.days.push(day);
    },

    appendDOMNode: function (elt) {
      var r = document.createElement("tr");
      var d = document.createElement("td");
      d.setAttribute("rowspan", this.days.length);
      d.innerHTML = this.label;
      r.appendChild(d);
      for (var i = 0; i < this.days.length; i++) {
        this.days[i].appendDOMNodes(r);
        elt.appendChild(r);
        r = document.createElement("tr");
      }
    }
  };

  function FinalWeek(data) {
    this.label = data.final;
    this.day = data.day;
  }
  FinalWeek.prototype = {

    appendDOMNode: function (elt) {
      var r = document.createElement("tr");
      var d = document.createElement("td");
      d.setAttribute("colspan", "2");
      d.innerHTML = "Finals Week";
      r.appendChild(d);

      d = document.createElement("td");
      d.setAttribute("colspan", "100%");
      d.setAttribute("class", "final");
      d.innerHTML = this.label;
      r.appendChild(d);
      elt.appendChild(r);
    }

  };


  function BreakWeek(data) {
    this.label = data.break;
  }
  BreakWeek.prototype = {

    appendDOMNode: function (elt) {
      var r = document.createElement("tr");
      var d = document.createElement("td");
      d.setAttribute("colspan", "100%");
      d.setAttribute("class", "break");
      d.innerHTML = this.label;
      r.appendChild(d);
      elt.appendChild(r);
    }

  };

  /*
   * takes an array of { name:x, url:y } pairs (optional url)
   * and makes them a tags, appending them to an element elt.
   */
  function DOMlinkify(arr, elt, clickable) {
    for (var i = 0; i < arr.length; i++) {
      var link = document.createElement("a");
      link.innerHTML = arr[i].name;
      if (arr[i].hasOwnProperty('url') && clickable) {
        link.href = arr[i].url;
      }
      elt.appendChild(link);
      elt.appendChild(document.createElement("br"));
    }
  }

  function Day(theDate, inputDay) {
    // take apart inputDay and make it into something useful.
    this.date = new Date(theDate);
    var localeOptions = { month: 'short', weekday: 'short', day: 'numeric' };
    this.stringDate = theDate.toLocaleDateString("en-US", localeOptions);
    if (inputDay.hasOwnProperty('topic'))
      this.topics = inputDay.topic;
    if (inputDay.hasOwnProperty('read'))
      this.read = inputDay.read;
    if (inputDay.hasOwnProperty('due'))
      this.due = inputDay.due;
    if (inputDay.hasOwnProperty('extra'))
      this.extra = inputDay.extra;
    if (inputDay.hasOwnProperty('class'))
      this.class = inputDay.class;
    if (inputDay.hasOwnProperty('mode'))
      this.mode = inputDay.mode;
    if (inputDay.hasOwnProperty('link'))
      this.link = inputDay.link;

    // Check if the link should be clickable based on the current date
    this.isLinkClickable = function () {
      // var currentDate = new Date();
      // var timeDiff = currentDate.getTime() - this.date.getTime();
      // var daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      // return daysDiff >= -4;
      return 1;
    };
  }
  Day.prototype = {
    appendDOMNodes: function (elt) {
      var d;
      var col;
      var cols = ["stringDate", "topics", "read", "due"];
      if (FORMAT['showExtra']) { cols.push("extra"); }
      for (var i = 0; i < cols.length; i++) {
        col = cols[i];
        d = document.createElement("td");
        if (col == "topics" && this.class) {
          d.classList.add(this.class);
        }
        if (this[col] && (col == "extra" || col == "read" || col == "due")) {
          DOMlinkify(this[col], d, this.isLinkClickable());
        } else if (this[col] && (col == "topics") && this.link && this.isLinkClickable()) {
          let le = document.createElement('a');
          le['href'] = this.link;
          le.innerHTML = this.hasOwnProperty(col) ? this[col] : "";
          d.appendChild(le);
        } else {
          d.innerHTML = this.hasOwnProperty(col) ? this[col] : "";
        }
        if (col == "topics" && this.mode) {
          let mode_img = document.createElement('img');
          mode_img.classList.add('mode_icon');
          mode_img.setAttribute('src', MODE_MAP[this.mode].src);
          mode_img.setAttribute('aria-label', MODE_MAP[this.mode].alt);
          mode_img.setAttribute('alt', MODE_MAP[this.mode].alt);
          mode_img.setAttribute('title', MODE_MAP[this.mode].alt);
          d.insertBefore(mode_img, d.childNodes[0]);
        }
        elt.appendChild(d);
      }
    }

  };

  // params should contain:
  // - startDate (Date() object)
  // - node (DOM parent node)
  function EmitSchedule(params) {
    var weekNum = params.hasOwnProperty('startWeek') ? params.startWeek : 1;
    var theDay;
    var theDate = params.startDate;
    var theWeek = new Week(weekNum);
    var WEEKS = [];

    // first, build header
    const DCE = function (foo) { return document.createElement(foo); }
    var tableNode = DCE("table");
    tableNode.setAttribute("class", "schedule");
    var cg = DCE("colgroup");
    var c = DCE("col");
    c.setAttribute('class', "firstCol");
    cg.appendChild(c);
    c = DCE("col");
    c.setAttribute('class', "secondCol");
    cg.appendChild(c);
    tableNode.appendChild(cg);

    var tr = DCE("tr");
    var th = DCE("th");
    th.setAttribute('colspan', '2');
    th.textContent = "Session";
    tr.appendChild(th);
    th = DCE("th"); th.textContent = "Topics"; tr.appendChild(th);
    th = DCE("th"); th.textContent = "Reading"; tr.appendChild(th);
    th = DCE("th"); th.textContent = "What's Due"; tr.appendChild(th);

    if (FORMAT['showExtra']) {
      th = DCE("th"); th.textContent = "Extra"; tr.appendChild(th);
    }
    tableNode.appendChild(tr);

    for (var i = 0; i < INPUT_DAYS.length; i++) {

      if (INPUT_DAYS[i].hasOwnProperty("break")) {
        // end any currently building week
        if (theWeek.days.length > 0) {
          WEEKS.push(theWeek);
          theWeek = new Week(weekNum);
        }

        // and append a break week.
        WEEKS.push(new BreakWeek(INPUT_DAYS[i]));
        if (INPUT_DAYS[i].hasOwnProperty("days")) {
          theDate.setDate(theDate.getDate() + INPUT_DAYS[i].days);
        } else if (INPUT_DAYS[i].hasOwnProperty("weeks")) {
          theDate.setDate(theDate.getDate() + (7 * INPUT_DAYS[i].weeks));
        } else {
          theDate.setDate(theDate.getDate() + 1);
        }

        // maybe the break causes a week to rewind
        if (INPUT_DAYS[i].hasOwnProperty("rewind")) {
          weekNum = weekNum - INPUT_DAYS[i].rewind;
        }
        // This is a hacking solution to make two-day break work
        // if (theDate.getDay() == 1) { // monday
        //   weekNum++;
        //   theWeek = new Week(weekNum);
        // }

        continue;
      }

      if (INPUT_DAYS[i].hasOwnProperty("final")) {
        WEEKS.push(new FinalWeek(INPUT_DAYS[i]));
        theDate.setDate(theDate.getDate() + (7 * INPUT_DAYS[i].weeks));
        continue;
      }



      theDay = new Day(theDate, INPUT_DAYS[i]);

      theWeek.appendDay(theDay);

      // Day++
      function dayPlusPlus() {
        theDate.setDate(theDate.getDate() + 1);

        // end week on Sunday
        if (theDate.getDay() == 0) { // sunday
          WEEKS.push(theWeek);
          weekNum++;
          theWeek = new Week(weekNum);
        }
      }
      dayPlusPlus();

      // skip over non-meetings
      while (FORMAT.meets.indexOf(DAYS_AS_CHARS[theDate.getDay()]) == -1) { dayPlusPlus(); }
    }
    WEEKS.push(theWeek);

    for (var i = 0; i < WEEKS.length; i++) {
      WEEKS[i].appendDOMNode(tableNode);
    }

    params.node.appendChild(tableNode);
  }

  return {
    EmitSchedule: EmitSchedule,
    DOMlinkify: DOMlinkify,
  };
}();


