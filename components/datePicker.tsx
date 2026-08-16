import React from 'react'
import DateTimePicker, { useDefaultStyles } from 'react-native-ui-datepicker'

export default function DatePicker({
    value,
    onChange,
    maxDate,
} : {
    value: Date
    onChange: (date: Date) => void
    maxDate?: Date
}) {
    const defaultStyles = useDefaultStyles("light")
  return (
    <DateTimePicker 
        mode='single'
        date={value}
        onChange={({date}) => 
            date && onChange(new Date(date as string | number | Date))
        }
        maxDate={maxDate}
        styles={{
            ...defaultStyles,
            today: {
                borderWidth: 1,
                borderColor: "#1A1D26"
            }
        }}
    />
  )
}