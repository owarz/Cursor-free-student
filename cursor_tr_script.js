// ==UserScript==
// @name         Cursor SheerID TR Türkiye Ekleme
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  SheerID doğrulama servisine TR (Türkiye) ülke kodunu ekler
// @author       Your Name
// @match        https://my.sheerid.com/*
// @match        https://*.sheerid.com/*
// @match        https://www.cursor.com/cn/student*
// @match        https://www.cursor.com/cn/student-verified*
// @match        https://cursor.com/cn/student*
// @match        https://services.sheerid.com/verify/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // API yanıtlarını yakalama ve değiştirme fonksiyonu
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
        const response = await originalFetch(url, options);
        
        // Sadece belirli URL'leri yakala
        if (url.includes('/rest/v2/program/681044b7729fba7beccd3565/theme') || 
            url.includes('theme?locale=') || 
            url.includes('/rest/v2/program/') && url.includes('/theme')) {
            try {
                // Yanıtı değiştirmek için klonla
                const clonedResponse = response.clone();
                const responseBody = await clonedResponse.json();
                
                // Ülkeler dizisini kontrol et ve değiştir
                if (responseBody && responseBody.config && Array.isArray(responseBody.config.countries)) {
                    // TR kodunun var olup olmadığını kontrol et
                    if (!responseBody.config.countries.includes('TR')) {
                        console.log('Türkiye (TR) ülke listesine ekleniyor...');
                        // TR'yi alfabetik sıraya göre ekle (TH ve TN arasına)
                        const thIndex = responseBody.config.countries.indexOf('TH');
                        if (thIndex !== -1) {
                            responseBody.config.countries.splice(thIndex + 1, 0, 'TR');
                        } else {
                            // TH bulunamazsa, listeye direkt ekle
                            responseBody.config.countries.push('TR');
                        }
                        
                        // TR için etiketleri ekle
                        if (responseBody.config.orgSearchCountryTags) {
                            responseBody.config.orgSearchCountryTags['TR'] = ["HEI", "qualifying_hs", "qualifying_ps"];
                        }
                        
                        console.log('Türkiye başarıyla ülke listesine eklendi');
                    }
                    
                    // Yeni yanıt objesi oluştur
                    return new Response(JSON.stringify(responseBody), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                }
            } catch (e) {
                console.error('Fetch yanıtı işlenirken hata:', e);
                return response;
            }
        }
        return response;
    };
    
    // XMLHttpRequest için de aynı işlemi yap
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;
    
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        this._url = url;
        return originalXHROpen.apply(this, [method, url, ...rest]);
    };
    
    XMLHttpRequest.prototype.send = function(body) {
        const xhr = this;
        
        if (xhr._url && (xhr._url.includes('/rest/v2/program/681044b7729fba7beccd3565/theme') || 
                        xhr._url.includes('theme?locale=') || 
                        xhr._url.includes('/rest/v2/program/') && xhr._url.includes('/theme'))) {
            const originalOnReadyStateChange = xhr.onreadystatechange;
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        const responseBody = JSON.parse(xhr.responseText);
                        
                        if (responseBody && responseBody.config && Array.isArray(responseBody.config.countries)) {
                            if (!responseBody.config.countries.includes('TR')) {
                                console.log('Türkiye (TR) ülke listesine ekleniyor... (XHR)');
                                const thIndex = responseBody.config.countries.indexOf('TH');
                                if (thIndex !== -1) {
                                    responseBody.config.countries.splice(thIndex + 1, 0, 'TR');
                                } else {
                                    responseBody.config.countries.push('TR');
                                }
                                
                                if (responseBody.config.orgSearchCountryTags) {
                                    responseBody.config.orgSearchCountryTags['TR'] = ["HEI", "qualifying_hs", "qualifying_ps"];
                                }
                                
                                console.log('Türkiye başarıyla ülke listesine eklendi (XHR)');
                            }
                            
                            // responseText özelliğini değiştir
                            Object.defineProperty(xhr, 'responseText', {
                                get: function() {
                                    return JSON.stringify(responseBody);
                                }
                            });
                        }
                    } catch (e) {
                        console.error('XHR yanıtı işlenirken hata:', e);
                    }
                }
                
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(xhr);
                }
            };
        }
        
        return originalXHRSend.apply(this, [body]);
    };
    
    console.log('Cursor SheerID TR Türkiye ekleme scripti yüklendi');
})(); 