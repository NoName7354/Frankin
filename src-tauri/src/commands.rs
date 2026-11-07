use crate::db::AppState;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use tauri::State;
use futures_util::StreamExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct Project { pub id: Option<i64>, pub name: String }

#[derive(Debug, Serialize, Deserialize)]
pub struct Tab {
    pub id: Option<i64>,
    pub project_id: i64,
    pub title: String,
    pub kind: String,
    pub position: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BoardItem {
    pub id: Option<i64>,
    pub tab_id: i64,
    #[serde(rename = "type")]
    pub kind: String,
    pub x: f64,
    pub y: f64,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub z_index: i64,
    pub payload: String,
}

#[derive(Debug, Serialize)]
pub struct AiMessage { pub role: String, pub content: String }

#[tauri::command]
pub fn get_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM projects ORDER BY created_at DESC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(Project { id: Some(r.get(0)?), name: r.get(1)? })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(state: State<AppState>, name: String) -> Result<i64, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO projects (name) VALUES (?1)", params![name]).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn delete_project(state: State<AppState>, id: i64) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_tabs(state: State<AppState>, project_id: i64) -> Result<Vec<Tab>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, project_id, title, kind, position FROM tabs WHERE project_id = ?1 ORDER BY position ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![project_id], |r| Ok(Tab {
        id: Some(r.get(0)?), project_id: r.get(1)?, title: r.get(2)?, kind: r.get(3)?, position: r.get(4)?
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_tab(state: State<AppState>, tab: Tab) -> Result<i64, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO tabs (project_id, title, kind, position) VALUES (?1, ?2, ?3, ?4)",
        params![tab.project_id, tab.title, tab.kind, tab.position]
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn delete_tab(state: State<AppState>, id: i64) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM tabs WHERE id = ?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_board_items(state: State<AppState>, tab_id: i64) -> Result<Vec<BoardItem>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, tab_id, type, x, y, width, height, z_index, payload FROM board_items WHERE tab_id = ?1 ORDER BY z_index ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![tab_id], |r| Ok(BoardItem {
        id: Some(r.get(0)?), tab_id: r.get(1)?, kind: r.get(2)?,
        x: r.get(3)?, y: r.get(4)?, width: r.get(5)?, height: r.get(6)?,
        z_index: r.get(7)?, payload: r.get(8)?
    })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_board_item(state: State<AppState>, item: BoardItem) -> Result<i64, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO board_items (tab_id, type, x, y, width, height, z_index, payload) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![item.tab_id, item.kind, item.x, item.y, item.width, item.height, item.z_index, item.payload]
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn update_board_item_position(state: State<AppState>, id: i64, x: f64, y: f64) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE board_items SET x=?1, y=?2 WHERE id=?3", params![x, y, id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_board_item(state: State<AppState>, id: i64) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM board_items WHERE id=?1", params![id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn import_file(project_id: i64, source_path: String) -> Result<String, String> {
    let dir = crate::db::app_data_dir().join("projects").join(project_id.to_string());
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let name = std::path::Path::new(&source_path).file_name().and_then(|s| s.to_str()).unwrap_or("file");
    let unique = format!("{}_{}", chrono::Utc::now().timestamp_millis(), name);
    let dest = dir.join(&unique);
    std::fs::copy(&source_path, &dest).map_err(|e| e.to_string())?;
    Ok(format!("projects/{}/{}", project_id, unique))
}

#[tauri::command]
pub fn open_file_external(rel_path: String) -> Result<(), String> {
    let abs = crate::db::app_data_dir().join(&rel_path);
    open::that(abs).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_app_data_dir() -> String {
    crate::db::app_data_dir().to_string_lossy().to_string()
}

const DEFAULT_HTML: &str = r#"<!DOCTYPE html>
<html><head><style>body{font-family:system-ui;padding:24px;}h1{color:#007acc;}</style></head>
<body><h1>РџСЂРёРІРµС‚, РјРёСЂ!</h1><p>Р РµРґР°РєС‚РёСЂСѓР№С‚Рµ HTML СЃР»РµРІР°.</p></body></html>"#;

#[tauri::command]
pub fn get_tab_content(state: State<AppState>, tab_id: i64) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let content: Option<String> = conn.query_row("SELECT content FROM tabs WHERE id=?1", params![tab_id], |r| r.get(0)).map_err(|e| e.to_string())?;
    Ok(content.unwrap_or_else(|| DEFAULT_HTML.to_string()))
}

#[tauri::command]
pub fn save_tab_content(state: State<AppState>, tab_id: i64, content: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE tabs SET content=?1 WHERE id=?2", params![content, tab_id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_ai_history(state: State<AppState>, tab_id: i64) -> Result<Vec<AiMessage>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT role, content FROM ai_messages WHERE tab_id=?1 ORDER BY created_at ASC").map_err(|e| e.to_string())?;
    let rows = stmt.query_map(params![tab_id], |r| Ok(AiMessage { role: r.get(0)?, content: r.get(1)? })).map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_ai_message(state: State<AppState>, tab_id: i64, role: String, content: String) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO ai_messages (tab_id, role, content) VALUES (?1, ?2, ?3)", params![tab_id, role, content]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_api_key(key: String) -> Result<(), String> {
    keyring::Entry::new("com.aiworkspace.app", "openrouter").map_err(|e| e.to_string())?.set_password(&key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_api_key() -> Result<String, String> {
    keyring::Entry::new("com.aiworkspace.app", "openrouter").map_err(|e| e.to_string())?.get_password().map_err(|e| e.to_string())
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "kind", content = "data")]
pub enum AiStreamEvent { Chunk(String), Done, Error(String) }

#[derive(serde::Serialize)]
struct ChatRequest<'a> { model: &'a str, messages: Vec<ChatMessage<'a>>, stream: bool }
#[derive(serde::Serialize)]
struct ChatMessage<'a> { role: &'a str, content: &'a str }

#[tauri::command]
pub async fn ask_ai_stream(prompt: String, api_key: String, on_event: Channel<AiStreamEvent>) -> Result<(), String> {
    let client = reqwest::Client::new();
    let body = ChatRequest {
        model: "deepseek/deepseek-r1:free",
        messages: vec![ChatMessage { role: "user", content: &prompt }],
        stream: true,
    };
    let response = client.post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body).send().await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        let s = response.status();
        let t = response.text().await.unwrap_or_default();
        let _ = on_event.send(AiStreamEvent::Error(format!("HTTP {}: {}", s, t)));
        return Ok(());
    }
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    while let Some(chunk) = stream.next().await {
        let c = chunk.map_err(|e| e.to_string())?;
        buffer.push_str(&String::from_utf8_lossy(&c));
        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim_end_matches('\r').to_string();
            buffer = buffer[pos + 1..].to_string();
            if line.starts_with(':') || !line.starts_with("data: ") { continue; }
            let data = &line[6..];
            if data == "[DONE]" { let _ = on_event.send(AiStreamEvent::Done); return Ok(()); }
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                if let Some(d) = v["choices"][0]["delta"]["content"].as_str() {
                    if !d.is_empty() { let _ = on_event.send(AiStreamEvent::Chunk(d.to_string())); }
                }
            }
        }
    }
    let _ = on_event.send(AiStreamEvent::Done);
    Ok(())
}
