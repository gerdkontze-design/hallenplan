import React, { useState, useEffect } from 'react';
import './App.css';

// Typen definieren
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const START_HOUR = 16;
const END_HOUR = 22;
const TIME_SLOTS = Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => START_HOUR * 60 + i * 30);

function App() {
  const [groups, setGroups] = useState([
    { id: '1', name: 'Fußball', color: '#3B82F6' },
    { id: '2', name: 'Basketball', color: '#EF4444' },
    { id: '3', name: 'Volleyball', color: '#10B981' },
  ]);

  const [bookings, setBookings] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTime, setSelectedTime] = useState(960); // 16:00 in Minuten
  const [selectedDuration, setSelectedDuration] = useState(60);

  // Lade Daten aus localStorage beim Start
  useEffect(() => {
    const savedBookings = localStorage.getItem('hallenplan-bookings');
    const savedGroups = localStorage.getItem('hallenplan-groups');

    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Speichere Daten in localStorage
  useEffect(() => {
    localStorage.setItem('hallenplan-bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('hallenplan-groups', JSON.stringify(groups));
  }, [groups]);

  const addBooking = () => {
    if (!selectedGroup) return;

    // Prüfe Konflikte
    const conflict = bookings.find(booking =>
      booking.day === selectedDay &&
      booking.startTime < selectedTime + selectedDuration &&
      booking.startTime + booking.duration > selectedTime
    );

    if (conflict) {
      alert('Zeitkonflikt! Diese Zeit ist bereits belegt.');
      return;
    }

    const newBooking = {
      id: Date.now().toString(),
      groupId: selectedGroup,
      day: selectedDay,
      startTime: selectedTime,
      duration: selectedDuration,
    };

    setBookings([...bookings, newBooking]);
  };

  const removeBooking = (bookingId) => {
    setBookings(bookings.filter(b => b.id !== bookingId));
  };

  const addGroup = () => {
    const name = prompt('Name der Sportgruppe:');
    if (!name) return;

    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const color = colors[groups.length % colors.length];

    const newGroup = {
      id: Date.now().toString(),
      name,
      color,
    };

    setGroups([...groups, newGroup]);
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getBookingAtTime = (day, time) => {
    return bookings.find(booking =>
      booking.day === day &&
      booking.startTime <= time &&
      booking.startTime + booking.duration > time
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Turnhallenbelegungsplan
        </h1>

        {/* Sportgruppen */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sportgruppen</h2>
            <button
              onClick={addGroup}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              + Gruppe hinzufügen
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {groups.map(group => (
              <div
                key={group.id}
                className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded"
              >
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: group.color }}
                ></div>
                <span>{group.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Neue Buchung */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Neue Buchung</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="">Sportgruppe wählen</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>

            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {DAYS.map((day, index) => (
                <option key={index} value={index}>{day}</option>
              ))}
            </select>

            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {TIME_SLOTS.map(time => (
                <option key={time} value={time}>
                  {formatTime(time)}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value={60}>60 Minuten</option>
                <option value={90}>90 Minuten</option>
              </select>
              <button
                onClick={addBooking}
                disabled={!selectedGroup}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded"
              >
                Buchen
              </button>
            </div>
          </div>
        </div>

        {/* Wochenplan */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Wochenplan</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2 bg-gray-50">Zeit</th>
                  {DAYS.map(day => (
                    <th key={day} className="border border-gray-300 p-2 bg-gray-50 min-w-32">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(time => (
                  <tr key={time}>
                    <td className="border border-gray-300 p-2 bg-gray-50 font-mono text-sm">
                      {formatTime(time)}
                    </td>
                    {DAYS.map((_, dayIndex) => {
                      const booking = getBookingAtTime(dayIndex, time);
                      return (
                        <td
                          key={dayIndex}
                          className="border border-gray-300 p-1 min-h-8 relative"
                        >
                          {booking && (
                            <div
                              className="absolute inset-0 flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: groups.find(g => g.id === booking.groupId)?.color }}
                              onClick={() => removeBooking(booking.id)}
                              title={`${groups.find(g => g.id === booking.groupId)?.name} - Klick zum Löschen`}
                            >
                              {groups.find(g => g.id === booking.groupId)?.name}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;