import { useEffect, useState } from "react";
import RichTextEditor from "./RichTextEditor";
import DraggableSection from "./DraggableSection";
import "./App.css";
import classicTemplateImg from "../../template_imgs/classicTemplate.svg";
import easyResumeImg from "../../template_imgs/easyResume.svg";
import modernImg from "../../template_imgs/modern.svg";
import html2pdf from "html2pdf.js";

const initialData = {
  basics: {
    name: "JOHN DOE",
    label: "",
    email: "johndoe@gmail.com",
    phone: "+91 123456789",
    location: "Karnataka,India",
    url: "https://www.linkedin.com/in/sudeep-sajjan/",
    summary: "",
  },
  workExperience: [
    {
      company: "TATA CONSULTANCY SERVICES",
      position: "Assistant System Engineer Trainee",
      startDate: "August 2024",
      endDate: "October 2025",
      location: "Bengaluru, India",
      description: "",
    },
    {
      company: "BLIP.FASHION",
      position: "Generalist Intern",
      startDate: "December 2024",
      endDate: "December 2024",
      location: "Bengaluru, India",
      description: "",
    },
    {
      company: "SWIGGY",
      position: "Food Delivery Executive",
      startDate: "October 2024",
      endDate: "October 2024",
      location: "Bengaluru, India",
      description: "",
    },
  ],
  education: [
    {
      institution: "Indian Institute Of Management",
      area: "Master of Business Administration (MBA)",
      startDate: "November 2025",
      endDate: "Current",
      location: "Bengaluru, Karnataka, India",
      gpa: "",
    },
    {
      institution: "Bengaluru Institue of Technology",
      area: "Bachelor of Engineering (B.E) in Computer Science",
      startDate: "October 2020",
      endDate: "June 2024",
      location: "Bagalkot, Karnataka, India",
      gpa: "",
    },
  ],
  skills: [
    "IT & Systems: ServiceNow, Jamf, CrowdStrike Falcon, ITIL Practices, Asset Management",
    "Product Management Tools: Figma, Whimsical, Amplitude Analytics, Excel",
    "Tech: Python(basic), SQL (basic), Microsoft Office Suite",
    "Business & Research: Market Research, ASO, Data Analysis",
    "Languages: English (Fluent), Hindi (Fluent), Kannada (Native)",
  ],
  projects: [
    {
      name: "GOOGLE INC",
      description: "",
      startDate: "June 2024",
      endDate: "August 2024",
    },
  ],
  customSections: [],
};

// Utilities to handle Month/Year conversions for the date picker
const parseMonthYear = (str) => {
  if (!str) return "";
  const lower = str.toLowerCase();
  if (lower === "present" || lower === "current") return "";
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };
  const parts = str.trim().split(/\s+/);
  if (parts.length === 2) {
    const month = months[parts[0].toLowerCase()];
    const year = parts[1];
    if (month && year && year.length === 4) return `${year}-${month}`;
  }
  return "";
};

const formatMonthYear = (str) => {
  if (!str) return "";
  const [year, month] = str.split("-");
  if (!year || !month) return str;
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const MonthYearPicker = ({ value, onChange, isEndDate }) => {
  const isPresent =
    value?.toLowerCase() === "present" || value?.toLowerCase() === "current";
  const monthVal = parseMonthYear(value);

  return (
    <div className="inline-input-group">
      <input
        type="month"
        value={isPresent ? "" : monthVal}
        onChange={(e) => onChange(formatMonthYear(e.target.value))}
        disabled={isPresent}
      />
      {isEndDate && (
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: 0,
            flex: "0 0 auto",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={isPresent}
            onChange={(e) => onChange(e.target.checked ? "Present" : "")}
            style={{
              width: "auto",
              flex: "0 0 auto",
              margin: 0,
              cursor: "pointer",
            }}
          />
          Present
        </label>
      )}
    </div>
  );
};

function App() {
  const [data, setData] = useState(initialData);
  const [templates, setTemplates] = useState([
    "classicTemplate",
    "easyTemplate",
    "modern",
  ]);
  const [template, setTemplate] = useState("classicTemplate");
  const [preview, setPreview] = useState("Loading preview...");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [viewMode, setViewMode] = useState("home");
  const [activeTab, setActiveTab] = useState("editor");
  const [expandedItem, setExpandedItem] = useState(null);
  const [sectionOrder, setSectionOrder] = useState([
    "workExperience",
    "education",
    "projects",
    "skills",
  ]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const templatePreviewImage = {
    classicTemplate: classicTemplateImg,
    easyTemplate: easyResumeImg,
    modern: modernImg,
  };

  const openTemplateModal = (key) => {
    setPreviewTemplate(key);
    setIsTemplateModalOpen(true);
  };

  const closeTemplateModal = () => {
    setIsTemplateModalOpen(false);
    setPreviewTemplate(null);
  };
  const getTemplatePreviewImage = (key) =>
    templatePreviewImage[key] || classicTemplateImg;

  const chooseTemplate = (key) => {
    setTemplate(key);
    setViewMode("editor");
    closeTemplateModal();
  };

  const [draggedSection, setDraggedSection] = useState(null);

  async function refreshPreview(payload) {
    setLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, data: payload || data }),
      });

      const text = await res.text();
      if (!res.ok) {
        let errMessage = "Server error occurred (empty response)";
        if (
          (res.status === 500 || res.status === 502 || res.status === 504) &&
          !text
        ) {
          errMessage =
            "Backend offline: Vite could not connect to the Node.js server. Please ensure the backend is running on port 4000.";
        }
        try {
          const errData = JSON.parse(text);
          errMessage = errData.error || errMessage;
        } catch (e) {
          errMessage = text || errMessage;
        }
        throw new Error(errMessage);
      }
      const json = JSON.parse(text);
      
      // Inject the A4 Page Break Visualizer script into the iframe HTML
      const visualizerScript = `
        <script>
          function initA4PageBreakVisualizer() {
            const body = document.body;
            const html = document.documentElement;
            if (!body || !html) return;
            
            const VISUALIZER_CLASS = 'a4-page-break-visualizer';
            let obs;
            let lastTargetHeight = 0;
            
            function updatePageBreaks() {
              // Temporarily disconnect the observer to prevent an infinite loop
              if (obs) obs.disconnect();
              
              document.querySelectorAll('.' + VISUALIZER_CLASS).forEach(el => el.remove());
              
              const width = html.clientWidth;
              if (width === 0) {
                if (obs) obs.observe(html, { childList: true, subtree: true, characterData: true, attributes: true });
                return;
              }
              
              // Calculate true content height ignoring the expanded iframe window
              let contentHeight = 0;
              const children = Array.from(body.children).filter(el => 
                !el.classList.contains(VISUALIZER_CLASS) && 
                !el.classList.contains('global-add-section') &&
                el.tagName.toLowerCase() !== 'script' &&
                el.tagName.toLowerCase() !== 'style'
              );
              
              children.forEach(el => {
                const rect = el.getBoundingClientRect();
                contentHeight = Math.max(contentHeight, rect.bottom + window.scrollY);
              });
              
              const pageHeight = width * (297 / 210); // A4 Aspect Ratio
              const totalPages = Math.max(1, Math.ceil(contentHeight / pageHeight));
              
              for (let i = 1; i <= totalPages; i++) {
                const pageBreak = document.createElement('div');
                pageBreak.className = VISUALIZER_CLASS + ' no-print';
                Object.assign(pageBreak.style, {
                  position: 'absolute', top: (i * pageHeight) + 'px', left: '0',
                  width: '100%', borderTop: '2px dashed #ef4444', zIndex: '9999',
                  pointerEvents: 'none', opacity: '0.8', display: 'flex', justifyContent: 'center'
                });
                
                const label = document.createElement('span');
                label.textContent = 'Page ' + i + ' Break';
                Object.assign(label.style, {
                  backgroundColor: '#ef4444', color: 'white', padding: '2px 8px',
                  fontSize: '11px', fontWeight: 'bold', fontFamily: 'sans-serif',
                  borderRadius: '0 0 4px 4px', transform: 'translateY(-2px)'
                });
                pageBreak.appendChild(label);
                body.appendChild(pageBreak);
              }
              
              // Resize iframe cleanly based on true content size
              const targetHeight = Math.max(contentHeight, (totalPages * pageHeight)) + 50;
              
              // Only postMessage if the height actually changed (prevents infinite resize loops)
              if (Math.abs(lastTargetHeight - targetHeight) > 2) {
                lastTargetHeight = targetHeight;
                window.parent.postMessage({ type: 'resizeIframe', height: targetHeight }, '*');
              }
              
              if (obs) obs.observe(html, { childList: true, subtree: true, characterData: true, attributes: true });
            }
            
            // Debounce the observer to prevent thread-locking on rapid edits
            let timeoutId;
            function debouncedUpdate() {
              clearTimeout(timeoutId);
              timeoutId = setTimeout(updatePageBreaks, 150);
            }
            
            obs = new MutationObserver(debouncedUpdate);
            obs.observe(html, { childList: true, subtree: true, characterData: true, attributes: true });
            new ResizeObserver(debouncedUpdate).observe(body);
            
            window.addEventListener('load', debouncedUpdate);
            debouncedUpdate();
          }
          initA4PageBreakVisualizer();
        </script>
      `;

      // Inject the Hover Editor Controls script into the iframe HTML
      const editorControlsScript = `
        <style>
          .section { position: relative; border: 2px solid transparent; transition: all 0.2s; border-radius: 4px; }
          .experience-item { position: relative; border: 2px solid transparent; transition: all 0.2s; border-radius: 4px; }
          
          .section:hover { border-color: #93c5fd; border-style: dashed; }
          .experience-item:hover { border-color: #fca5a5; border-style: dashed; }
          
          .hover-btn {
            position: absolute;
            display: none;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 4px 8px;
            font-size: 14px;
            cursor: pointer;
            z-index: 10000;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .section:hover > .sec-btn,
          .experience-item:hover > .item-btn {
            display: block;
          }
          
          .hover-btn:hover { background: #f8fafc; transform: scale(1.05); }
          
          .btn-add-entry { top: -14px; right: 40px; color: #059669; }
          .btn-del-sec { top: -14px; right: -10px; color: #e11d48; }
          .btn-del-entry { top: -12px; right: -12px; color: #e11d48; }
          
          .global-add-section {
            display: block;
            width: calc(100% - 40px);
            margin: 20px auto;
            text-align: center;
            padding: 12px;
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            color: #64748b;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-family: sans-serif;
            transition: all 0.2s;
          }
          .global-add-section:hover { background: #f1f5f9; border-color: #94a3b8; color: #334155; }
          
          @media print {
            .no-print { display: none !important; }
            .section, .experience-item { border: none !important; }
          }
        </style>
        <script>
          function initHoverEditorControls() {
            const parentDoc = window.parent.document;
            if (!parentDoc) return;

            const sections = document.querySelectorAll('.section');
            sections.forEach((sec, sIdx) => {
              
              let targetParent = null;
              const parentSections = Array.from(parentDoc.querySelectorAll('.draggable-section'));
              
              // Map iframe sections to parent sidebar sections robustly by content
              const headers = sec.querySelectorAll('h1, h2, h3, h4, h5, .section-title, .heading');
              const headerText = Array.from(headers).map(h => h.textContent.toLowerCase()).join(' ');
              
              if (headerText.includes('experience')) targetParent = parentDoc.getElementById('workExperience');
              else if (headerText.includes('education')) targetParent = parentDoc.getElementById('education');
              else if (headerText.includes('project')) targetParent = parentDoc.getElementById('projects');
              else if (headerText.includes('skill')) targetParent = parentDoc.getElementById('skills');
              
              if (!targetParent) {
                  targetParent = parentSections.find(p => {
                      const input = p.querySelector('input');
                      const h2 = p.querySelector('h2');
                      const titleText = ((input && input.value) || (h2 && h2.textContent) || '').toLowerCase().trim();
                      return titleText && headerText.includes(titleText);
                  });
              }
              if (!targetParent) targetParent = parentSections[sIdx];

              // 1. Delete Section Button (Primarily maps to Custom Sections)
              const delSec = document.createElement('button');
              delSec.className = 'hover-btn sec-btn btn-del-sec no-print';
              delSec.innerHTML = '🗑️';
              delSec.title = 'Delete Section';
              delSec.onclick = (e) => {
                 if (e.isTrusted && targetParent) {
                   const delBtn = targetParent.querySelector('.section-header .btn-remove[title="Remove Section"]');
                   if (delBtn) delBtn.click();
                 }
                 sec.remove();
              };
              sec.appendChild(delSec);
              
              // 2. Add Entry Button
              const addEnt = document.createElement('button');
              addEnt.className = 'hover-btn sec-btn btn-add-entry no-print';
              addEnt.innerHTML = '➕';
              addEnt.title = 'Add Entry';
              addEnt.onclick = (e) => {
                 if (e.isTrusted && targetParent) {
                   const addBtn = targetParent.querySelector('.section-header .btn-secondary');
                   if (addBtn) addBtn.click();
                 }
                 // Visual Clone Feedback
                 const items = sec.querySelectorAll('.experience-item');
                 if (items.length > 0) {
                   const clone = items[items.length - 1].cloneNode(true);
                   clone.querySelectorAll('[contenteditable]').forEach(el => {
                     el.textContent = 'New Data';
                     el.setAttribute('contenteditable', 'true');
                   });
                   clone.querySelectorAll('.hover-btn').forEach(btn => btn.remove());
                   
                   const delEntClone = document.createElement('button');
                   delEntClone.className = 'hover-btn item-btn btn-del-entry no-print';
                   delEntClone.innerHTML = '❌';
                   delEntClone.title = 'Delete Entry';
                   delEntClone.onclick = (e2) => {
                     if (e2.isTrusted && targetParent) {
                       const pDelBtns = targetParent.querySelectorAll('summary .btn-remove, .inline-input-group .btn-remove');
                       // Next expected index maps to length before clone addition
                       if (pDelBtns[items.length]) pDelBtns[items.length].click();
                     }
                     clone.remove();
                   };
                   clone.appendChild(delEntClone);
                   sec.appendChild(clone);
                 }
              };
              sec.appendChild(addEnt);
              
              // 3. Delete Entry Buttons
              const items = sec.querySelectorAll('.experience-item');
              items.forEach((item, iIdx) => {
                 const delEnt = document.createElement('button');
                 delEnt.className = 'hover-btn item-btn btn-del-entry no-print';
                 delEnt.innerHTML = '❌';
                 delEnt.title = 'Delete Entry';
                 delEnt.onclick = (e) => {
                   if (e.isTrusted && targetParent) {
                     const pDelBtns = targetParent.querySelectorAll('summary .btn-remove, .inline-input-group .btn-remove');
                     if (pDelBtns[iIdx]) pDelBtns[iIdx].click();
                   }
                   item.remove();
                 };
                 item.appendChild(delEnt);
              });
            });
            
            // 4. Global Add New Section Button
            const globalAdd = document.createElement('button');
            globalAdd.className = 'global-add-section no-print';
            globalAdd.innerHTML = '➕ Add New Section';
            globalAdd.onclick = (e) => {
               if (e.isTrusted) {
                 const parentBtns = parentDoc.querySelectorAll('.sections-container > .btn-secondary');
                 const targetBtn = Array.from(parentBtns).find(b => b.textContent.includes('Add Custom Section'));
                 if (targetBtn) targetBtn.click();
               }
               
               const sections = document.querySelectorAll('.section');
               if (sections.length > 0) {
                 const clone = sections[sections.length - 1].cloneNode(true);
                 clone.querySelectorAll('[contenteditable]').forEach(el => {
                   el.textContent = 'New Data';
                   el.setAttribute('contenteditable', 'true');
                 });
                 globalAdd.parentNode.insertBefore(clone, globalAdd);
               }
            };
            document.body.appendChild(globalAdd);
          }
          setTimeout(initHoverEditorControls, 250);
        </script>
      `;

      setPreview((json.html || "") + visualizerScript + editorControlsScript);
    } catch (err) {
      // Only overwrite the preview with an error if it hasn't loaded yet.
      // Otherwise, keep the previous successful preview to avoid disrupting the user while typing.
      setPreview((prev) =>
        prev === "Loading preview..." || !prev
          ? `<div style="padding: 20px; color: red; font-family: sans-serif; text-align: center;"><strong>Error building preview:</strong><br/>${err.message}<br/><br/>Ensure your backend server is running.</div>`
          : prev,
      );
      console.warn("Live preview sync failed:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (!res.ok) {
          throw new Error("Failed to fetch templates");
        }
        const json = await res.json();
        if (json.templates && json.templates.length > 0) {
          setTemplates(json.templates);
        }
      } catch (e) {
        console.warn("Templates endpoint failed, using defaults");
      }
    }
    loadTemplates();
  }, []);

  // Listen for live edits coming from the preview iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "updateField") {
        updateField(event.data.path, event.data.value);
      } else if (event.data?.type === "resizeIframe") {
        const iframe = document.querySelector(".preview-frame");
        if (iframe) {
          iframe.style.height = event.data.height + "px";
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      refreshPreview();
    }, 500); // Debounce to prevent constant backend requests while typing
    return () => clearTimeout(debounceTimer);
  }, [data, template]);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      let body;
      if (type === "pdf") {
        // Grab the iframe containing the live preview
        const iframe = document.querySelector(".preview-frame");
        const element = iframe?.contentDocument?.documentElement;

        if (!element) {
          throw new Error("Preview not loaded yet.");
        }

        // Clone the node to strip out contenteditable attributes
        const clonedElement = element.cloneNode(true);
        const editables = clonedElement.querySelectorAll("[contenteditable]");
        editables.forEach((el) => el.removeAttribute("contenteditable"));

        // Strip out the page break visualizers before exporting
        const noPrints = clonedElement.querySelectorAll(".no-print");
        noPrints.forEach((el) => el.remove());

        const opt = {
          margin: 0,
          filename: "resume.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        };

        await html2pdf().set(opt).from(clonedElement).save();
      } else {
        // For DOCX
        body = JSON.stringify({ data, template });
        const res = await fetch(`/api/export/${type}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!res.ok) {
          const text = await res.text();
          let errMessage = "Export failed";
          try {
            const errData = JSON.parse(text);
            errMessage = errData.error || errMessage;
          } catch (e) {
            errMessage = text || errMessage;
          }
          throw new Error(errMessage);
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `resume.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert(`Export error: ${err.message}`);
      console.error(err);
    } finally {
      setExporting(null);
    }
  };

  const updateField = (path, value) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let cursor = copy;
      keys.forEach((key, idx) => {
        if (idx === keys.length - 1) cursor[key] = value;
        else cursor = cursor[key] || (cursor[key] = {});
      });
      return copy;
    });
  };

  const addItem = (section) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (section === "workExperience")
        copy.workExperience.push({
          company: "",
          position: "",
          startDate: "",
          endDate: "",
          location: "",
          description: "",
        });
      else if (section === "education")
        copy.education.push({
          institution: "",
          area: "",
          startDate: "",
          endDate: "",
          location: "",
          gpa: "",
        });
      else if (section === "projects")
        copy.projects.push({
          name: "",
          description: "",
          startDate: "",
          endDate: "",
        });
      else if (section === "skills") copy.skills.push("");
      return copy;
    });
  };

  const removeItem = (section, idx) => {
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (section === "workExperience") copy.workExperience.splice(idx, 1);
      else if (section === "education") copy.education.splice(idx, 1);
      else if (section === "projects") copy.projects.splice(idx, 1);
      else if (section === "skills") copy.skills.splice(idx, 1);
      return copy;
    });
  };

  const updateArrayField = (section, idx, field, value) => {
    updateField(`${section}.${idx}.${field}`, value);
  };

  const handleDragStart = (e, sectionId) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetSectionId) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      return;
    }

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSectionId);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);

    setSectionOrder(newOrder);
    setDraggedSection(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
  };

  const addCustomSection = () => {
    const id = `custom_${Date.now()}`;
    setData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (!copy.customSections) copy.customSections = [];
      copy.customSections.push({
        id,
        title: "Custom Section",
        items: [],
      });
      return copy;
    });
    setSectionOrder((prev) => [...prev, id]);
  };

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case "workExperience":
        return (
          <DraggableSection
            key={sectionId}
            id={sectionId}
            title="Work Experience"
            isDragging={draggedSection === sectionId}
            onDragStart={(e) => handleDragStart(e, sectionId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, sectionId)}
          >
            <div className="section-header">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addItem("workExperience")}
                style={{ marginBottom: "10px" }}
              >
                + Add Experience
              </button>
            </div>
            {data.workExperience.map((exp, idx) => (
              <details
                key={idx}
                className="collapsible-item"
                open={expandedItem === `exp-${idx}`}
                onToggle={(e) =>
                  setExpandedItem(e.currentTarget.open ? `exp-${idx}` : null)
                }
              >
                <summary>
                  <span>{exp.company || "Company"}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem("workExperience", idx);
                    }}
                  >
                    ✕
                  </button>
                </summary>
                <div className="collapsible-content">
                  <label>Company</label>
                  <input
                    value={exp.company}
                    onChange={(e) =>
                      updateArrayField(
                        "workExperience",
                        idx,
                        "company",
                        e.target.value,
                      )
                    }
                    placeholder="Company name"
                  />
                  <label>Position</label>
                  <input
                    value={exp.position}
                    onChange={(e) =>
                      updateArrayField(
                        "workExperience",
                        idx,
                        "position",
                        e.target.value,
                      )
                    }
                    placeholder="Job title"
                  />
                  <label>Start Date</label>
                  <MonthYearPicker
                    value={exp.startDate}
                    onChange={(val) =>
                      updateArrayField("workExperience", idx, "startDate", val)
                    }
                  />
                  <label>End Date</label>
                  <MonthYearPicker
                    value={exp.endDate}
                    onChange={(val) =>
                      updateArrayField("workExperience", idx, "endDate", val)
                    }
                    isEndDate
                  />
                  <label>Location</label>
                  <input
                    value={exp.location}
                    onChange={(e) =>
                      updateArrayField(
                        "workExperience",
                        idx,
                        "location",
                        e.target.value,
                      )
                    }
                    placeholder="City, Country"
                  />
                  <label>Description</label>
                  <RichTextEditor
                    value={exp.description}
                    onChange={(html) =>
                      updateArrayField(
                        "workExperience",
                        idx,
                        "description",
                        html,
                      )
                    }
                    placeholder="Add formatted description..."
                  />
                </div>
              </details>
            ))}
          </DraggableSection>
        );

      case "education":
        return (
          <DraggableSection
            key={sectionId}
            id={sectionId}
            title="Education"
            isDragging={draggedSection === sectionId}
            onDragStart={(e) => handleDragStart(e, sectionId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, sectionId)}
          >
            <div className="section-header">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addItem("education")}
                style={{ marginBottom: "10px" }}
              >
                + Add Education
              </button>
            </div>
            {data.education.map((edu, idx) => (
              <details
                key={idx}
                className="collapsible-item"
                open={expandedItem === `edu-${idx}`}
                onToggle={(e) =>
                  setExpandedItem(e.currentTarget.open ? `edu-${idx}` : null)
                }
              >
                <summary>
                  <span>{edu.institution || "School"}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={(e) => {
                      e.preventDefault();
                      removeItem("education", idx);
                    }}
                  >
                    ✕
                  </button>
                </summary>
                <div className="collapsible-content">
                  <label>Institution</label>
                  <input
                    value={edu.institution}
                    onChange={(e) =>
                      updateArrayField(
                        "education",
                        idx,
                        "institution",
                        e.target.value,
                      )
                    }
                    placeholder="School/University"
                  />
                  <label>Area of Study</label>
                  <input
                    value={edu.area}
                    onChange={(e) =>
                      updateArrayField("education", idx, "area", e.target.value)
                    }
                    placeholder="Major/Degree"
                  />
                  <label>Start Date</label>
                  <MonthYearPicker
                    value={edu.startDate}
                    onChange={(val) =>
                      updateArrayField("education", idx, "startDate", val)
                    }
                  />
                  <label>End Date</label>
                  <MonthYearPicker
                    value={edu.endDate}
                    onChange={(val) =>
                      updateArrayField("education", idx, "endDate", val)
                    }
                    isEndDate
                  />
                  <label>Location</label>
                  <input
                    value={edu.location || ""}
                    onChange={(e) =>
                      updateArrayField(
                        "education",
                        idx,
                        "location",
                        e.target.value,
                      )
                    }
                    placeholder="City, Country"
                  />
                  <label>GPA</label>
                  <input
                    value={edu.gpa}
                    onChange={(e) =>
                      updateArrayField("education", idx, "gpa", e.target.value)
                    }
                    placeholder="3.8"
                  />
                </div>
              </details>
            ))}
          </DraggableSection>
        );

      case "projects":
        return (
          <DraggableSection
            key={sectionId}
            id={sectionId}
            title="Projects"
            isDragging={draggedSection === sectionId}
            onDragStart={(e) => handleDragStart(e, sectionId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, sectionId)}
          >
            <div className="section-header">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addItem("projects")}
                style={{ marginBottom: "10px" }}
              >
                + Add Project
              </button>
            </div>
            {data.projects &&
              data.projects.map((project, idx) => (
                <details
                  key={idx}
                  className="collapsible-item"
                  open={expandedItem === `proj-${idx}`}
                  onToggle={(e) =>
                    setExpandedItem(e.currentTarget.open ? `proj-${idx}` : null)
                  }
                >
                  <summary>
                    <span>{project.name || "Project"}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        removeItem("projects", idx);
                      }}
                    >
                      ✕
                    </button>
                  </summary>
                  <div className="collapsible-content">
                    <label>Project Name</label>
                    <input
                      value={project.name}
                      onChange={(e) =>
                        updateArrayField(
                          "projects",
                          idx,
                          "name",
                          e.target.value,
                        )
                      }
                      placeholder="Project name"
                    />
                    <label>Description</label>
                    <RichTextEditor
                      value={project.description}
                      onChange={(html) =>
                        updateArrayField("projects", idx, "description", html)
                      }
                      placeholder="Add formatted project description..."
                    />
                    <label>Start Date</label>
                    <MonthYearPicker
                      value={project.startDate}
                      onChange={(val) =>
                        updateArrayField("projects", idx, "startDate", val)
                      }
                    />
                    <label>End Date</label>
                    <MonthYearPicker
                      value={project.endDate}
                      onChange={(val) =>
                        updateArrayField("projects", idx, "endDate", val)
                      }
                      isEndDate
                    />
                  </div>
                </details>
              ))}
          </DraggableSection>
        );

      case "skills":
        return (
          <DraggableSection
            key={sectionId}
            id={sectionId}
            title="Skills"
            isDragging={draggedSection === sectionId}
            onDragStart={(e) => handleDragStart(e, sectionId)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, sectionId)}
          >
            <div className="section-header">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => addItem("skills")}
                style={{ marginBottom: "10px" }}
              >
                + Add Skill
              </button>
            </div>
            {data.skills.map((skill, idx) => (
              <div key={idx} className="inline-input-group">
                <input
                  value={skill}
                  onChange={(e) => updateField(`skills.${idx}`, e.target.value)}
                  placeholder="Skill name"
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeItem("skills", idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </DraggableSection>
        );

      default:
        if (sectionId.startsWith("custom_")) {
          const customIdx = data.customSections?.findIndex(
            (s) => s.id === sectionId,
          );
          if (customIdx === -1 || customIdx === undefined) return null;
          const sectionData = data.customSections[customIdx];

          return (
            <DraggableSection
              key={sectionId}
              id={sectionId}
              title={sectionData.title || "Custom Section"}
              isDragging={draggedSection === sectionId}
              onDragStart={(e) => handleDragStart(e, sectionId)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, sectionId)}
            >
              <div className="section-header" style={{ marginBottom: "10px" }}>
                <input
                  style={{ flex: 1 }}
                  value={sectionData.title}
                  onChange={(e) =>
                    updateField(
                      `customSections.${customIdx}.title`,
                      e.target.value,
                    )
                  }
                  placeholder="Section Title"
                />
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => {
                    setData((prev) => {
                      const copy = JSON.parse(JSON.stringify(prev));
                      copy.customSections.splice(customIdx, 1);
                      return copy;
                    });
                    setSectionOrder((prev) =>
                      prev.filter((id) => id !== sectionId),
                    );
                  }}
                  title="Remove Section"
                >
                  ✕
                </button>
              </div>
              <div className="section-header">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setData((prev) => {
                      const copy = JSON.parse(JSON.stringify(prev));
                      copy.customSections[customIdx].items.push({
                        name: "",
                        subtitle: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      });
                      return copy;
                    });
                  }}
                  style={{ marginBottom: "10px" }}
                >
                  + Add Item
                </button>
              </div>

              {sectionData.items.map((item, idx) => (
                <details
                  key={idx}
                  className="collapsible-item"
                  open={expandedItem === `${sectionId}-${idx}`}
                  onToggle={(e) =>
                    setExpandedItem(
                      e.currentTarget.open ? `${sectionId}-${idx}` : null,
                    )
                  }
                >
                  <summary>
                    <span>{item.name || "Item"}</span>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={(e) => {
                        e.preventDefault();
                        setData((prev) => {
                          const copy = JSON.parse(JSON.stringify(prev));
                          copy.customSections[customIdx].items.splice(idx, 1);
                          return copy;
                        });
                      }}
                    >
                      ✕
                    </button>
                  </summary>
                  <div className="collapsible-content">
                    <label>Name / Title</label>
                    <input
                      value={item.name || ""}
                      onChange={(e) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.name`,
                          e.target.value,
                        )
                      }
                      placeholder="E.g., Certification Name, Award, etc."
                    />
                    <label>Subtitle / Role</label>
                    <input
                      value={item.subtitle || ""}
                      onChange={(e) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.subtitle`,
                          e.target.value,
                        )
                      }
                      placeholder="Optional subtitle"
                    />
                    <label>Start Date</label>
                    <MonthYearPicker
                      value={item.startDate}
                      onChange={(val) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.startDate`,
                          val,
                        )
                      }
                    />
                    <label>End Date</label>
                    <MonthYearPicker
                      value={item.endDate}
                      onChange={(val) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.endDate`,
                          val,
                        )
                      }
                      isEndDate
                    />
                    <label>Location</label>
                    <input
                      value={item.location || ""}
                      onChange={(e) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.location`,
                          e.target.value,
                        )
                      }
                      placeholder="City, Country"
                    />
                    <label>Description</label>
                    <RichTextEditor
                      value={item.description || ""}
                      onChange={(html) =>
                        updateField(
                          `customSections.${customIdx}.items.${idx}.description`,
                          html,
                        )
                      }
                      placeholder="Add description..."
                    />
                  </div>
                </details>
              ))}
            </DraggableSection>
          );
        }
        return null;
    }
  };

  if (viewMode === "home") {
    return (
      <div className="app home-screen">
        <div className="home-container">
          <div className="logo home-logo">ResumeBuilder</div>
          <h2 className="template-select-title">Select a resume template</h2>
          <div className="template-grid">
            {templates.map((tpl) => (
              <div
                key={tpl}
                className="template-card"
                onClick={() => openTemplateModal(tpl)}
              >
                <img
                  src={getTemplatePreviewImage(tpl)}
                  alt={`${tpl} preview`}
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop if fallback image is also missing
                    e.target.src = classicTemplateImg;
                  }}
                />
                <h3>{tpl}</h3>
              </div>
            ))}
          </div>
          {isTemplateModalOpen && previewTemplate && (
            <div
              className="template-modal-overlay"
              onClick={closeTemplateModal}
            >
              <div
                className="template-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeTemplateModal}
                >
                  ✕
                </button>
                <h2>{previewTemplate} Preview</h2>
                <img
                  className="template-modal-img"
                  src={getTemplatePreviewImage(previewTemplate)}
                  alt={`${previewTemplate} full preview`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = classicTemplateImg;
                  }}
                />
                <div className="template-modal-actions">
                  <button
                    type="button"
                    className="btn-primary use-template-btn"
                    onClick={() => chooseTemplate(previewTemplate)}
                  >
                    Use this template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-container">
        {/* Tabs for mobile */}
        <div className="tabs-container">
          <button
            type="button"
            className={`tab ${activeTab === "editor" ? "active" : ""}`}
            onClick={() => setActiveTab("editor")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "preview" ? "active" : ""}`}
            onClick={() => setActiveTab("preview")}
          >
            Preview
          </button>
        </div>

        {/* Editor */}
        <aside className={`panel ${activeTab === "editor" ? "show" : ""}`}>
          <div className="editor-header">
            <h1>Resume Builder</h1>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setViewMode("home")}
            >
              Change Template
            </button>
          </div>

          <div className="template-selector">
            <label>Template:</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Basics Section */}
          <section className="form-section">
            <h2>Basics</h2>
            <label>Name</label>
            <input
              value={data.basics.name}
              onChange={(e) => updateField("basics.name", e.target.value)}
              placeholder="Full name"
            />

            <label>Headline</label>
            <input
              value={data.basics.label}
              onChange={(e) => updateField("basics.label", e.target.value)}
              placeholder="Job title"
            />

            <label>Email</label>
            <input
              value={data.basics.email}
              onChange={(e) => updateField("basics.email", e.target.value)}
              placeholder="email@example.com"
            />

            <label>Phone</label>
            <input
              value={data.basics.phone}
              onChange={(e) => updateField("basics.phone", e.target.value)}
              placeholder="+1 234 567 8900"
            />

            <label>Location</label>
            <input
              value={data.basics.location}
              onChange={(e) => updateField("basics.location", e.target.value)}
              placeholder="City, Country"
            />

            <label>URL / Website</label>
            <input
              value={data.basics.url || ""}
              onChange={(e) => updateField("basics.url", e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />

            <label>Summary</label>
            <textarea
              value={data.basics.summary}
              onChange={(e) => updateField("basics.summary", e.target.value)}
              placeholder="Brief professional summary..."
              rows={3}
            />
          </section>

          {/* Draggable Sections Container */}
          <div className="sections-container">
            {sectionOrder.map((sectionId) => renderSection(sectionId))}
            <button
              type="button"
              className="btn-secondary"
              onClick={addCustomSection}
              style={{ borderStyle: "dashed", marginTop: "10px" }}
            >
              + Add Custom Section
            </button>
          </div>

          {/* Actions */}
          <section className="form-section">
            <h2>Export</h2>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleExport("pdf")}
              disabled={!!exporting}
            >
              {exporting === "pdf" ? (
                <>
                  <span className="export-spinner">⏳</span> Downloading...
                </>
              ) : (
                "📄 Export PDF"
              )}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => handleExport("docx")}
              disabled={!!exporting}
            >
              {exporting === "docx" ? (
                <>
                  <span className="export-spinner">⏳</span> Downloading...
                </>
              ) : (
                "📋 Export DOCX"
              )}
            </button>
          </section>
        </aside>

        {/* Preview */}
        <main
          className={`preview-section ${activeTab === "preview" ? "show" : ""}`}
        >
          <div className="toolbar">
            {loading ? "Building preview..." : `Template: ${template}`}
          </div>
          <div className="preview">
            <iframe
              title="Resume live preview"
              className="preview-frame"
              srcDoc={preview}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
