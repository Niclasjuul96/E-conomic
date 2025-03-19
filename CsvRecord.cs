using CsvHelper.Configuration.Attributes;
using System;

public class CsvRecord
{
    [TypeConverter(typeof(CsvValuesConverter))]
    public DateTime Dato { get; set; }

    public string Tekst { get; set; }

    [TypeConverter(typeof(CsvValuesConverter))]
    public decimal Beløb { get; set; }

    [TypeConverter(typeof(CsvValuesConverter))]
    public decimal Saldo { get; set; }

    public string Afstemt { get; set; }
    public string Kontonummer { get; set; }
    public string Kontonavn { get; set; }
    public string Hovedkategori { get; set; }
    public string Kategori { get; set; }
    public string Kommentar { get; set; }
}
