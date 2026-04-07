import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./RichTextEditor.css";

export const RichTextEditor = ({ value, onChange, placeholder }) => {
  const modules = {
    toolbar: [
      ["bold", "italic", "underline"],
      [{ list: "bullet" }, { list: "ordered" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  return (
    <div className="rte-container">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || "Enter description..."}
      />
    </div>
  );
};

export default RichTextEditor;
