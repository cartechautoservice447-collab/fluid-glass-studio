using System;
using System.Windows;

namespace LiquidGlassStudio;

public partial class MainWindow : Window
{
    private const string AppUrl = "https://fluid-glass-studio.lovable.app/";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            await Browser.EnsureCoreWebView2Async();
            Browser.CoreWebView2.Settings.AreDevToolsEnabled = false;
            Browser.CoreWebView2.Settings.IsStatusBarEnabled = false;
            Browser.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
            Browser.Source = new Uri(AppUrl);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Liquid Glass Studio could not start.\n\n{ex.Message}",
                "Liquid Glass Studio",
                MessageBoxButton.OK,
                MessageBoxImage.Error);
        }
    }
}
