#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;

use db::AppState;
use std::sync::Mutex;

fn main() {
    let conn = db::init_db().expect("Failed to init DB");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(AppState { db: Mutex::new(conn) })
        .invoke_handler(tauri::generate_handler![
            commands::get_projects, commands::create_project, commands::delete_project,
            commands::get_tabs, commands::create_tab, commands::delete_tab,
            commands::get_board_items, commands::create_board_item,
            commands::update_board_item_position, commands::delete_board_item,
            commands::import_file, commands::open_file_external, commands::get_app_data_dir,
            commands::get_tab_content, commands::save_tab_content,
            commands::get_ai_history, commands::save_ai_message,
            commands::save_api_key, commands::get_api_key, commands::ask_ai_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
