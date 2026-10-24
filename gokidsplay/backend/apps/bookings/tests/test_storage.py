from ninja_backend.storage import ProxiedAzureStorage


def test_uploaded_files_are_served_through_the_backend():
    storage = ProxiedAzureStorage(connection_string='DefaultEndpointsProtocol=https;AccountName=x;AccountKey=eA==;'
                                                    'EndpointSuffix=core.windows.net', azure_container='media')
    assert storage.url('logos/new logo.png') == '/media/logos/new%20logo.png'
    assert storage.url('/gokidsplay-logo.png') == '/media/gokidsplay-logo.png'
