'use client'

import { useState, useEffect } from 'react'
import styles from './page.module.css'

interface Habit {
  id: string
  name: string
  icon: string
  createdAt: string
  completedDates: string[]
  reminderTime?: string
}

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('⭐')
  const [reminderTime, setReminderTime] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)

  const icons = ['⭐', '💪', '📚', '🏃', '🧘', '💧', '🥗', '😴', '✍️', '🎯']

  useEffect(() => {
    const stored = localStorage.getItem('habits')
    if (stored) {
      setHabits(JSON.parse(stored))
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true)
    }
  }, [])

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('habits', JSON.stringify(habits))
    }
  }, [habits])

  useEffect(() => {
    if (!notificationsEnabled) return

    const checkReminders = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = now.toISOString().split('T')[0]

      habits.forEach(habit => {
        if (habit.reminderTime === currentTime && !habit.completedDates.includes(today)) {
          new Notification('Habit Reminder', {
            body: `Time to complete: ${habit.name}`,
            icon: habit.icon,
          })
        }
      })
    }

    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [habits, notificationsEnabled])

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        setNotificationsEnabled(true)
      }
    }
  }

  const addHabit = () => {
    if (!newHabitName.trim()) return

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabitName.trim(),
      icon: selectedIcon,
      createdAt: new Date().toISOString(),
      completedDates: [],
      reminderTime: reminderTime || undefined,
    }

    setHabits([...habits, habit])
    setNewHabitName('')
    setSelectedIcon('⭐')
    setReminderTime('')
    setShowAddForm(false)

    if (reminderTime && !notificationsEnabled) {
      requestNotificationPermission()
    }
  }

  const toggleHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0]

    setHabits(habits.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(today)
        return {
          ...habit,
          completedDates: isCompleted
            ? habit.completedDates.filter(date => date !== today)
            : [...habit.completedDates, today]
        }
      }
      return habit
    }))
  }

  const deleteHabit = (habitId: string) => {
    if (confirm('Delete this habit?')) {
      setHabits(habits.filter(h => h.id !== habitId))
    }
  }

  const getStreak = (habit: Habit): number => {
    if (habit.completedDates.length === 0) return 0

    const sortedDates = [...habit.completedDates].sort().reverse()
    let streak = 0
    const today = new Date()

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today)
      expectedDate.setDate(today.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (sortedDates[i] === expectedDateStr) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const isCompletedToday = (habit: Habit): boolean => {
    const today = new Date().toISOString().split('T')[0]
    return habit.completedDates.includes(today)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>🎯 Habit Tracker</h1>
        <p className={styles.subtitle}>Build streaks, build habits</p>
      </header>

      <main className={styles.main}>
        {habits.length === 0 && !showAddForm && (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>No habits yet. Start building your routine!</p>
          </div>
        )}

        <div className={styles.habitList}>
          {habits.map(habit => (
            <div key={habit.id} className={styles.habitCard}>
              <div className={styles.habitHeader}>
                <div className={styles.habitIcon}>{habit.icon}</div>
                <div className={styles.habitInfo}>
                  <h3 className={styles.habitName}>{habit.name}</h3>
                  <div className={styles.habitMeta}>
                    <span className={styles.streak}>
                      🔥 {getStreak(habit)} day streak
                    </span>
                    {habit.reminderTime && (
                      <span className={styles.reminder}>
                        🔔 {habit.reminderTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.habitActions}>
                <button
                  className={`${styles.checkButton} ${isCompletedToday(habit) ? styles.checked : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                >
                  {isCompletedToday(habit) ? '✓' : '○'}
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => deleteHabit(habit.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {showAddForm && (
          <div className={styles.addForm}>
            <input
              type="text"
              placeholder="Habit name"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className={styles.input}
              autoFocus
            />

            <div className={styles.iconSelector}>
              {icons.map(icon => (
                <button
                  key={icon}
                  className={`${styles.iconButton} ${selectedIcon === icon ? styles.iconSelected : ''}`}
                  onClick={() => setSelectedIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>

            <div className={styles.reminderSection}>
              <label className={styles.reminderLabel}>
                Reminder time (optional):
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className={styles.timeInput}
                />
              </label>
            </div>

            <div className={styles.formActions}>
              <button onClick={addHabit} className={styles.saveButton}>
                Add Habit
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewHabitName('')
                  setSelectedIcon('⭐')
                  setReminderTime('')
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button
            className={styles.addButton}
            onClick={() => setShowAddForm(true)}
          >
            + Add Habit
          </button>
        )}
      </main>
    </div>
  )
}
