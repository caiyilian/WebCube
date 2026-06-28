import type { Move } from '../../shared/types'

export interface MoveRecord {
  move: Move
  inverseMove: Move
}

export class MoveHistory {
  private undoStack: MoveRecord[] = []
  private redoStack: MoveRecord[] = []
  private onHistoryChangeCallback: (() => void) | null = null

  public onHistoryChange(callback: () => void): void {
    this.onHistoryChangeCallback = callback
  }

  // 记录操作
  public record(move: Move): void {
    const inverseMove = this.getInverseMove(move)
    this.undoStack.push({ move, inverseMove })
    this.redoStack = [] // 新操作清空重做栈
    this.notifyHistoryChange()
  }

  // 撤销
  public undo(): Move | null {
    if (this.undoStack.length === 0) return null
    
    const record = this.undoStack.pop()!
    this.redoStack.push(record)
    this.notifyHistoryChange()
    
    return record.inverseMove
  }

  // 重做
  public redo(): Move | null {
    if (this.redoStack.length === 0) return null
    
    const record = this.redoStack.pop()!
    this.undoStack.push(record)
    this.notifyHistoryChange()
    
    return record.move
  }

  // 获取反向操作
  private getInverseMove(move: Move): Move {
    if (move.includes("'")) {
      return move.replace("'", '') as Move
    } else {
      return `${move}'` as Move
    }
  }

  // 检查是否可以撤销
  public canUndo(): boolean {
    return this.undoStack.length > 0
  }

  // 检查是否可以重做
  public canRedo(): boolean {
    return this.redoStack.length > 0
  }

  // 清空历史
  public clear(): void {
    this.undoStack = []
    this.redoStack = []
    this.notifyHistoryChange()
  }

  // 获取历史长度
  public getHistoryLength(): number {
    return this.undoStack.length
  }

  // 通知历史变化
  private notifyHistoryChange(): void {
    if (this.onHistoryChangeCallback) {
      this.onHistoryChangeCallback()
    }
  }
}
