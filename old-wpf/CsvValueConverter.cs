using CsvHelper.Configuration;
using CsvHelper.TypeConversion;
using CsvHelper;
using System;
using System.Globalization;

public class CsvValuesConverter : DefaultTypeConverter
{
    public override object ConvertFromString(string text, IReaderRow row, MemberMapData memberMapData)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return base.ConvertFromString(text, row, memberMapData);
        }

        if (memberMapData.Member.Name == "Dato")
        {
            if (DateTime.TryParseExact(text, "dd.MM.yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateValue))
            {
                return dateValue;
            }
            throw new TypeConverterException(this, memberMapData, text, row.Context);
        }

        if (memberMapData.Member.Name == "Beløb" || memberMapData.Member.Name == "Saldo")
        {
            // Ensure proper decimal parsing for Danish format (thousands: ".", decimal: ",")
            text = text.Replace(".", "").Replace(",", string.Empty);

            if (decimal.TryParse(text, NumberStyles.AllowDecimalPoint | NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out decimal decimalValue))
            {
                return decimalValue;
            }

            throw new TypeConverterException(this, memberMapData, text, row.Context);
        }

        return base.ConvertFromString(text, row, memberMapData);
    }
}
