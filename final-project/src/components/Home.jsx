import React, { useState, useRef, useEffect } from "react";
import { Camera, Link2, Paperclip, Trash2 } from "lucide-react";
import "./Home.css";

const ROLE_PASSWORDS = {
  admin: "admin1234",
  faculty: "faculty1234",
};

export default function AnnouncementApp() {
  const [role, setRole] = useState(null); // null, "student", "faculty", "admin"
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [formatType, setFormatType] = useState("single");
  const [structuredFields, setStructuredFields] = useState({
    what: "", where: "", when: "", who: ""
  });

  const [contentBlocks, setContentBlocks] = useState([{ type: "text", content: "" }]);
  const [announcements, setAnnouncements] = useState([]);

  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/announcements")
      .then(res => res.json())
      .then(data => setAnnouncements(data))
      .catch(err => console.error("Failed to fetch announcements:", err));
  }, []);

  // LOGIN HANDLER
  const handleLogin = () => {
    if (loginPassword === ROLE_PASSWORDS.admin) {
      setRole("admin");
      setLoginError("");
    } else if (loginPassword === ROLE_PASSWORDS.faculty) {
      setRole("faculty");
      setLoginError("");
    } else if (loginPassword === "") {
      setRole("student");
      setLoginError("");
    } else {
      setLoginError("Invalid password");
    }
    setLoginPassword("");
  };

  // LOGOUT
  const handleLogout = () => {
    setRole(null);
    setLoginError("");
  };

  // Content block and announcement handlers remain the same, with posting & deleting disabled for students and null role

  const updateLastText = (newText) => {
    setContentBlocks((blocks) => {
      const last = blocks[blocks.length - 1];
      if (last && last.type === "text") {
        return [...blocks.slice(0, -1), { type: "text", content: newText }];
      } else {
        return [...blocks, { type: "text", content: newText }];
      }
    });
  };

  const handleTextChange = (e) => {
    updateLastText(e.target.value);
  };

  const handleAddLink = () => {
    if (!canPost()) return;
    const url = prompt("Enter a URL:");
    if (url) {
      try {
        const validatedUrl = new URL(url);
        setContentBlocks((blocks) => [...blocks, { type: "link", content: validatedUrl.href }, { type: "text", content: "" }]);
      } catch {
        alert("Invalid URL. Please enter a valid link.");
      }
    }
  };

  const handleAddImages = (e) => {
    if (!canPost()) return;
    const newImages = Array.from(e.target.files);
    const filteredImages = newImages.filter(
      (img) => img.type === "image/png" || img.type === "image/jpeg"
    );
    if (filteredImages.length !== newImages.length) {
      alert("Only PNG and JPEG images are allowed. Unsupported files were ignored.");
    }
    if (filteredImages.length) {
      setContentBlocks((blocks) => [...blocks, ...filteredImages.map(img => ({ type: "image", content: img })), { type: "text", content: "" }]);
    }
    e.target.value = null;
  };

  const handleAddFiles = (e) => {
    if (!canPost()) return;
    const newFiles = Array.from(e.target.files);
    if (newFiles.length) {
      setContentBlocks((blocks) => [...blocks, ...newFiles.map(f => ({ type: "file", content: f })), { type: "text", content: "" }]);
    }
    e.target.value = null;
  };

  const removeBlock = (idx) => {
    if (!canPost()) return;
    setContentBlocks((blocks) => blocks.filter((_, i) => i !== idx));
  };

  const deleteAnnouncement = (id) => {
    if (!canDelete()) return;
    fetch(`http://localhost:5000/api/announcements/${id}`, {
      method: "DELETE",
    })
      .then(res => {
        if (res.ok) {
          setAnnouncements((anns) => anns.filter((a) => a.id !== id));
        } else {
          throw new Error("Failed to delete");
        }
      })
      .catch(err => console.error("Delete error:", err));
  };

  const handlePost = () => {
    if (!canPost()) return;

    let blocksToPost = [...contentBlocks];

    if (formatType === "structured") {
      const { what, where, when, who } = structuredFields;
      if (!what && !where && !when && !who) {
        alert("Please fill in at least one field.");
        return;
      }

      blocksToPost = [
        what && { type: "text", content: `What: ${what}` },
        where && { type: "text", content: `Where: ${where}` },
        when && { type: "text", content: `When: ${when}` },
        who && { type: "text", content: `Who: ${who}` },
      ].filter(Boolean);

      // Reset form
      setStructuredFields({ what: "", where: "", when: "", who: "" });
      setContentBlocks([...blocksToPost, { type: "text", content: "" }]);
    }

    const hasContent = blocksToPost.some(block => {
      if (block.type === "text") return block.content.trim() !== "";
      else return true;
    });

    if (!hasContent) {
      alert("Please add some content");
      return;
    }

    const announcementData = {
      contentBlocks: blocksToPost.map(block => {
        if (block.type === "image" || block.type === "file") {
          return { ...block, content: "FILE_OR_IMAGE_PLACEHOLDER" };
        }
        return block;
      }),
    };

    fetch("http://localhost:5000/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(announcementData),
    })
      .then(res => {
        if (!res.ok) throw new Error("Post failed");
        return res.json();
      })
      .then(data => {
        const newAnnouncement = {
          id: data.id,
          contentBlocks: blocksToPost,
          date: new Date().toLocaleString(),
        };
        setAnnouncements([newAnnouncement, ...announcements]);
        setContentBlocks([{ type: "text", content: "" }]);
      })
      .catch(err => {
        console.error("Post error:", err);
        alert("Failed to post announcement");
      });
  };

  const lastText = contentBlocks.length && contentBlocks[contentBlocks.length - 1].type === "text"
    ? contentBlocks[contentBlocks.length - 1].content
    : "";

  // Helpers to check permissions
  function canPost() {
    return role === "faculty" || role === "admin";
  }

  function canDelete() {
    return role === "faculty" || role === "admin";
  }

  // UI
  if (role === null) {
    // Show login form
    return (
      <div className="container py-4" style={{ maxWidth: 400 }}>
        <h1 className="h4 fw-bold mb-3">Login to Announcement Board</h1>
        <p>Enter password for faculty or admin. Leave empty to login as student (read-only).</p>
        <input
          type="password"
          className="form-control mb-2"
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
        />
        <button className="btn btn-primary w-100" onClick={handleLogin}>Login</button>
        {loginError && <p className="text-danger mt-2">{loginError}</p>}
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 fw-bold">📢 Announcement Board</h1>
        <div>
          <span className="me-3 fw-semibold">Role: {role}</span>
          <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {(role === "faculty" || role === "admin") && (
        <>
          <div className="mb-3">
            <label className="form-label fw-semibold">Select Announcement Format:</label>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                value="single"
                checked={formatType === "single"}
                onChange={() => setFormatType("single")}
              />
              <label className="form-check-label">Single Textarea</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                value="structured"
                checked={formatType === "structured"}
                onChange={() => setFormatType("structured")}
              />
              <label className="form-check-label">What / Where / When / Who</label>
            </div>
          </div>

          {formatType === "single" ? (
            <textarea
              className="form-control mb-2"
              rows={3}
              placeholder="Write your announcement here..."
              value={lastText}
              onChange={handleTextChange}
            />
          ) : (
            <div className="mb-2">
              <input
                type="text"
                className="form-control mb-1"
                placeholder="What?"
                value={structuredFields.what}
                onChange={(e) => setStructuredFields({ ...structuredFields, what: e.target.value })}
              />
              <input
                type="text"
                className="form-control mb-1"
                placeholder="Where?"
                value={structuredFields.where}
                onChange={(e) => setStructuredFields({ ...structuredFields, where: e.target.value })}
              />
              <div className="input-group mb-1">
                <input
                  type="text"
                  className="form-control"
                  placeholder="When?"
                  value={structuredFields.when}
                  onChange={(e) => setStructuredFields({ ...structuredFields, when: e.target.value })}
                />
                <span className="input-group-text" style={{ cursor: "pointer", padding: "0" }}>
                  <input
                    type="datetime-local"
                    className="form-control"
                    style={{ width: "38px", border: "none", cursor: "pointer" }}
                    onChange={(e) => {
                      const formatted = new Date(e.target.value).toLocaleString();
                      setStructuredFields({ ...structuredFields, when: formatted });
                    }}
                    title="Pick Date and Time"
                  />
                </span>
              </div>
              <input
                type="text"
                className="form-control"
                placeholder="Who?"
                value={structuredFields.who}
                onChange={(e) => setStructuredFields({ ...structuredFields, who: e.target.value })}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/png, image/jpeg"
            multiple
            style={{ display: "none" }}
            ref={imageInputRef}
            onChange={handleAddImages}
          />
          <input
            type="file"
            multiple
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleAddFiles}
          />

          <div className="d-flex gap-2 mb-3 align-items-stretch">
            <button type="button" className="btn btn-light border p-2 d-flex align-items-center justify-content-center" title="Add Photo" onClick={() => imageInputRef.current.click()}>
              <Camera className="text-primary" size={20} />
            </button>
            <button type="button" className="btn btn-light border p-2 d-flex align-items-center justify-content-center" title="Add Link" onClick={handleAddLink}>
              <Link2 className="text-success" size={20} />
            </button>
            <button type="button" className="btn btn-light border p-2 d-flex align-items-center justify-content-center" title="Attach File" onClick={() => fileInputRef.current.click()}>
              <Paperclip className="text-purple" size={20} />
            </button>
            <button id="post-button" type="button" className="btn btn-primary flex-grow-1" onClick={handlePost}>
              Post Announcement
            </button>
          </div>

          <div className="mb-4">
            {contentBlocks.map((block, idx) => {
              if (block.type === "text" && idx === contentBlocks.length - 1) return null;
              switch (block.type) {
                case "text":
                  return (
                    <div key={idx} className="mb-2 position-relative border rounded p-2 bg-light">
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordWrap: "break-word", overflowWrap: "break-word" }}>{block.content}</pre>
                      <button id="delete-btn" type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" style={{ transform: "translate(25%, -25%)" }} onClick={() => removeBlock(idx)} title="Remove Text">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                case "link":
                  return (
                    <div key={idx} className="mb-2 d-flex justify-content-between align-items-center border rounded p-2 bg-light">
                      <a href={block.content} target="_blank" rel="noopener noreferrer" className="text-success">{block.content}</a>
                      <button id="delete-btn" type="button" className="btn btn-sm btn-danger" onClick={() => removeBlock(idx)} title="Remove Link">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                case "image":
                  return (
                    <div key={idx} className="mb-2 position-relative d-inline-block me-2">
                      <img src={URL.createObjectURL(block.content)} alt="preview" style={{ maxWidth: "150px", maxHeight: "120px", borderRadius: "0.25rem" }} />
                      <button id="delete-btn" type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" style={{ transform: "translate(25%, -25%)" }} onClick={() => removeBlock(idx)} title="Remove Image">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                case "file":
                  return (
                    <div key={idx} className="mb-2 d-flex justify-content-between align-items-center border rounded p-2 bg-light">
                      <span>{block.content.name}</span>
                      <button id="delete-btn" type="button" className="btn btn-sm btn-danger" onClick={() => removeBlock(idx)} title="Remove File">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                default:
                  return null;
              }
            })}
          </div>
        </>
      )}

      <hr />
      <h2 className="h5 mb-3">Announcements</h2>
      {announcements.length === 0 && <p>No announcements available.</p>}
      {announcements.map((ann) => (
        <div key={ann.id} className="mb-3 border rounded p-3 bg-white shadow-sm">
          {ann.contentBlocks.map((block, idx) => {
            switch (block.type) {
              case "text":
                return <p key={idx} style={{ whiteSpace: "pre-wrap" }}>{block.content}</p>;
              case "link":
                return <p key={idx}><a href={block.content} target="_blank" rel="noopener noreferrer" className="text-success">{block.content}</a></p>;
              case "image":
                return <img key={idx} src={block.content} alt="announcement" style={{ maxWidth: "300px", marginBottom: 8 }} />;
              case "file":
                return <p key={idx}><a href={block.content} download>{block.content}</a></p>;
              default:
                return null;
            }
          })}
          <small className="text-muted">{ann.date}</small>
          {(role === "faculty" || role === "admin") && (
            <button
              className="btn btn-sm btn-outline-danger float-end"
              onClick={() => deleteAnnouncement(ann.id)}
              title="Delete Announcement"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}


