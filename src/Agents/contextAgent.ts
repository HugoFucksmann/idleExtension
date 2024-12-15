import * as vscode from "vscode";

/**
 * Clase que gestiona el estado compartido entre diferentes agentes en la extensión.
 * Almacena y administra datos relacionados con la interacción del usuario y el procesamiento de código.
 */
export class AgenteDeContexto {
  private almacenamiento: Map<string, any>;

  constructor() {
    this.almacenamiento = new Map<string, any>();
    this.inicializarValoresPorDefecto();
  }

  /**
   * Inicializa el almacenamiento con valores por defecto
   */
  private inicializarValoresPorDefecto(): void {
    this.almacenamiento.set("prompt", "");
    this.almacenamiento.set("archivosRelevantes", []);
    this.almacenamiento.set("dependencias", null);
    this.almacenamiento.set("propuestaModificacion", "");
    this.almacenamiento.set("estadoInteraccion", "pendiente");
  }

  /**
   * Guarda un valor en el contexto asociado a una clave específica
   * @param clave - La clave bajo la cual se almacenará el valor
   * @param valor - El valor a almacenar
   */
  public guardarDatos(clave: string, valor: any): void {
    this.almacenamiento.set(clave, valor);
  }

  /**
   * Recupera un valor del contexto basado en su clave
   * @param clave - La clave del valor a recuperar
   * @returns El valor almacenado o undefined si no existe
   */
  public obtenerDatos(clave: string): any {
    return this.almacenamiento.get(clave);
  }

  /**
   * Limpia todos los datos almacenados en el contexto y restaura los valores por defecto
   */
  public limpiarContexto(): void {
    this.almacenamiento.clear();
    this.inicializarValoresPorDefecto();
  }

  /**
   * Verifica si existe un valor para una clave específica
   * @param clave - La clave a verificar
   * @returns true si la clave existe, false en caso contrario
   */
  public existeClave(clave: string): boolean {
    return this.almacenamiento.has(clave);
  }

  /**
   * Obtiene todas las claves almacenadas en el contexto
   * @returns Array con todas las claves almacenadas
   */
  public obtenerClaves(): string[] {
    return Array.from(this.almacenamiento.keys());
  }

  /**
   * Elimina una entrada específica del contexto
   * @param clave - La clave del valor a eliminar
   * @returns true si se eliminó exitosamente, false si la clave no existía
   */
  public eliminarDatos(clave: string): boolean {
    return this.almacenamiento.delete(clave);
  }
}
