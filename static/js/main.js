document.addEventListener('DOMContentLoaded', () => {
    // --- Elements for Upload ---
    const imageInput = document.getElementById('image-input');
    const dropArea = document.getElementById('drop-area');
    const imagePreviewContainerInitial = document.getElementById('image-preview-container-initial');
    const imagePreviewInitial = document.getElementById('image-preview-initial');
    const imageNameInitial = document.getElementById('image-name-initial');
    const predictButton = document.getElementById('predict-button');
    const loadingSpinnerInitial = document.getElementById('loading-spinner-initial');

    // --- Elements for Disease Detection Section ---
    const diseaseDetectionSection = document.getElementById('disease-detection-section');
    const predictionResult = document.getElementById('prediction-result');
    const confidenceBar = document.getElementById('confidence-bar');
    const confidenceScoreText = document.getElementById('confidence-score-text');
    const imagePreviewSummary = document.getElementById('image-preview-summary');
    const imageNameSummary = document.getElementById('image-name-summary');

    // --- Elements for Additional Information Section ---
    const additionalInfoSection = document.getElementById('additional-info-section');
    const additionalInfoContent = document.getElementById('additional-info-content');
    const getReportButton = document.getElementById('get-report-button');
    const loadingSpinnerReport = document.getElementById('loading-spinner-report');

    // --- Elements for AI Report Section ---
    const reportSectionStandalone = document.getElementById('report-section-standalone');
    const finalReportContent = document.getElementById('final-report-content');
    const startOverButton = document.getElementById('start-over-button');

    // --- General Elements ---
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const sampleImageCards = document.querySelectorAll('.sample-image-card');

    let predictedDiseaseName = '';
    let currentImageFile = null;
    let currentConfidence = 0;

    // Enhanced report presentation
    function enhanceReportPresentation(container) {
        if (!container) return;
        if (container.dataset.enhanced === 'true') return;
        container.dataset.enhanced = 'true';

        container.classList.add('report-content');

        // Wrap content into sections based on headings
        const originalNodes = Array.from(container.childNodes);
        const frag = document.createDocumentFragment();

        let sectionEl = null;
        const pushSection = () => {
            if (sectionEl && sectionEl.childNodes.length > 0) frag.appendChild(sectionEl);
            sectionEl = null;
        };

        for (const node of originalNodes) {
            const isHeading =
                node.nodeType === Node.ELEMENT_NODE &&
                /^(H1|H2|H3)$/.test(node.tagName);

            if (isHeading) {
                pushSection();
                sectionEl = document.createElement('section');
                sectionEl.className = 'bg-light rounded-3 p-4 mb-4 border-start border-success border-4';
                sectionEl.appendChild(node);
                continue;
            }

            if (!sectionEl) {
                sectionEl = document.createElement('section');
                sectionEl.className = 'bg-light rounded-3 p-4 mb-4 border-start border-primary border-4';
            }
            sectionEl.appendChild(node);
        }
        pushSection();

        container.innerHTML = '';
        container.appendChild(frag);

        // Add Bootstrap styling to key points
        container.querySelectorAll('li').forEach((li) => {
            const text = (li.textContent || '').trim();
            if (text.length > 0 && text.length <= 140) {
                li.classList.add('bg-success', 'bg-opacity-10', 'rounded', 'p-2', 'mb-2');
            }
        });

        // Style strong elements
        container.querySelectorAll('strong').forEach((strong) => {
            strong.classList.add('text-success', 'fw-bold');
        });
    }

    // Function to show error message
    function showError(message) {
        errorText.textContent = message;
        errorMessage.classList.remove('d-none');
        // Scroll to error message
        errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Function to hide error message
    function hideError() {
        errorMessage.classList.add('d-none');
    }

    // Function to reset the form to initial state
    function resetForm() {
        // Hide all sections except hero
        diseaseDetectionSection.classList.add('d-none');
        additionalInfoSection.classList.add('d-none');
        reportSectionStandalone.classList.add('d-none');
        loadingSpinnerInitial.classList.add('d-none');
        loadingSpinnerReport.classList.add('d-none');
        hideError();

        // Reset UI elements
        imageInput.value = '';
        imagePreviewContainerInitial.classList.add('d-none');
        imagePreviewInitial.src = '';
        imageNameInitial.textContent = '';
        predictButton.disabled = true;

        // Reset form data
        predictionResult.textContent = '';
        confidenceBar.style.width = '0%';
        confidenceScoreText.textContent = '';
        finalReportContent.innerHTML = '';
        predictedDiseaseName = '';
        currentImageFile = null;
        currentConfidence = 0;

        // Remove any confidence warnings
        const existingWarning = document.getElementById('confidence-warning');
        if (existingWarning) existingWarning.remove();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Function to handle file processing
    function handleFile(file) {
        hideError();
        if (file && file.type.startsWith('image/')) {
            // Check file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showError("File size too large. Please upload an image smaller than 5MB.");
                return;
            }

            currentImageFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreviewInitial.src = e.target.result;
                imagePreviewSummary.src = e.target.result;
                imagePreviewContainerInitial.classList.remove('d-none');
                imageNameInitial.textContent = file.name;
                imageNameSummary.textContent = file.name;
                predictButton.disabled = false;
                
                // Add success feedback
                dropArea.classList.add('border-success');
                setTimeout(() => {
                    dropArea.classList.remove('border-success');
                }, 2000);
            };
            reader.readAsDataURL(file);

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            imageInput.files = dataTransfer.files;

        } else {
            imagePreviewContainerInitial.classList.add('d-none');
            imagePreviewInitial.src = '';
            imageNameInitial.textContent = '';
            predictButton.disabled = true;
            currentImageFile = null;
            if (file) {
                showError("Please upload a valid image file (JPG, PNG, JPEG).");
            }
        }
    }

    // Handle image file selection
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        handleFile(file);
    });

    // Handle sample image click
    sampleImageCards.forEach(card => {
        card.addEventListener('click', async () => {
            hideError();
            const imagePath = card.dataset.imagePath;
            const imageNameText = card.dataset.imageName;

            // Add loading state to clicked card
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';

            try {
                const response = await fetch(imagePath);
                const blob = await response.blob();
                const file = new File([blob], imageNameText, { type: blob.type });
                handleFile(file);
            } catch (error) {
                showError("Failed to load sample image. Please try again.");
                console.error("Error loading sample image:", error);
            } finally {
                // Reset card state
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        });
    });

    // Handle click on drop area
    dropArea.addEventListener('click', () => {
        imageInput.click();
    });

    // Drag and Drop Event Listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    dropArea.addEventListener('dragenter', highlight, false);
    dropArea.addEventListener('dragover', highlight, false);
    dropArea.addEventListener('dragleave', unhighlight, false);
    dropArea.addEventListener('drop', handleDrop, false);

    function highlight() {
        dropArea.classList.add('dragover');
    }

    function unhighlight() {
        dropArea.classList.remove('dragover');
    }

    function handleDrop(e) {
        unhighlight();
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    // Handle Predict button click
    predictButton.addEventListener('click', async () => {
        hideError();
        if (!currentImageFile) {
            showError("Please select or drop an image first.");
            return;
        }

        const formData = new FormData();
        formData.append('image', currentImageFile);

        // Show loading state
        loadingSpinnerInitial.classList.remove('d-none');
        predictButton.disabled = true;
        predictButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';

        // Scroll to loading section
        loadingSpinnerInitial.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Prediction failed.');
            }

            const data = await response.json();
            predictedDiseaseName = data.predicted_class_name;
            currentConfidence = data.confidence;

            // Format disease name
            let formattedDisease = predictedDiseaseName.replace(/_/g, ' ');
            const words = formattedDisease.split(' ');
            if (words.length > 1 && words[0] === words[1]) {
                words.splice(1, 1);
            }
            formattedDisease = words.join(' ');

            // Update UI with results
            predictionResult.innerHTML = `<span class="fw-bold text-success">${formattedDisease}</span>`;
            confidenceBar.style.width = `${currentConfidence}%`;
            confidenceScoreText.textContent = `${currentConfidence.toFixed(1)}%`;

            // Add confidence warning if needed
            const existingWarning = document.getElementById('confidence-warning');
            if (existingWarning) existingWarning.remove();
            
            if (currentConfidence < 60) {
                const warning = document.createElement('div');
                warning.id = 'confidence-warning';
                warning.className = 'alert alert-warning mt-3';
                warning.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Low confidence prediction. Please retake the image in good lighting for better accuracy.';
                predictionResult.parentElement.appendChild(warning);
            }

            // Hide loading and show results
            loadingSpinnerInitial.classList.add('d-none');
            diseaseDetectionSection.classList.remove('d-none');
            
            // Create and populate additional info form
            createAdditionalInfoForm();
            additionalInfoSection.classList.remove('d-none');

            // Scroll to results
            diseaseDetectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Error:', error);
            showError(`Failed to get prediction: ${error.message}`);
        } finally {
            loadingSpinnerInitial.classList.add('d-none');
            predictButton.disabled = false;
            predictButton.innerHTML = '<i class="fas fa-microscope me-2"></i>Analyze Image';
        }
    });

    // Create additional information form
    function createAdditionalInfoForm() {
        const formSections = [
            {
                title: 'Plant Symptoms',
                icon: 'fas fa-leaf',
                color: 'success',
                fields: [
                    {
                        id: 'leaf-discoloration',
                        label: 'Leaf discoloration observed?',
                        options: ['', 'Yellowing', 'Browning', 'Reddening', 'Spots', 'None', 'Other']
                    },
                    {
                        id: 'wilting-dropping',
                        label: 'Wilting or dropping?',
                        options: ['', 'Wilting', 'Dropping', 'None', 'Slight', 'Severe']
                    }
                ]
            },
            {
                title: 'Environmental Conditions',
                icon: 'fas fa-cloud-sun',
                color: 'info',
                fields: [
                    {
                        id: 'recent-weather',
                        label: 'Recent weather conditions?',
                        options: ['', 'Dry', 'Humid', 'Rainy', 'Normal', 'Extreme Heat', 'Extreme Cold']
                    },
                    {
                        id: 'temperature-condition',
                        label: 'Temperature condition?',
                        options: ['', 'Normal', 'Hot', 'Cold', 'Fluctuating']
                    }
                ]
            },
            {
                title: 'Treatment History',
                icon: 'fas fa-flask',
                color: 'warning',
                fields: [
                    {
                        id: 'recent-fertilizer',
                        label: 'Recent fertilizer application?',
                        options: ['', 'Yes (NPK)', 'Yes (Organic)', 'Yes (Other)', 'No']
                    },
                    {
                        id: 'previous-pesticide',
                        label: 'Previous pesticide use?',
                        options: ['', 'Yes (Fungicide)', 'Yes (Insecticide)', 'Yes (Herbicide)', 'No']
                    }
                ]
            },
            {
                title: 'Pest Observations',
                icon: 'fas fa-bug',
                color: 'danger',
                fields: [
                    {
                        id: 'insects-observed',
                        label: 'Insects observed?',
                        options: ['', 'Aphids', 'Whiteflies', 'Spider Mites', 'Caterpillars', 'None', 'Other']
                    },
                    {
                        id: 'evidence-of-damage',
                        label: 'Evidence of pest damage?',
                        options: ['', 'Chewing marks', 'Holes in leaves', 'Sticky residue', 'None', 'Visible pests']
                    }
                ]
            },
            {
                title: 'Plant Management',
                icon: 'fas fa-hand-holding-water',
                color: 'secondary',
                fields: [
                    {
                        id: 'watering-frequency',
                        label: 'Watering frequency?',
                        options: ['', 'Daily', 'Every few days', 'Weekly', 'Irregular', 'Overwatering signs', 'Underwatering signs']
                    },
                    {
                        id: 'plant-age-growth',
                        label: 'Plant age/growth stage?',
                        options: ['', 'Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature']
                    }
                ]
            }
        ];

        additionalInfoContent.innerHTML = '';

        formSections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'col-lg-6 mb-4';
            
            sectionDiv.innerHTML = `
                <div class="card h-100 border-${section.color}">
                    <div class="card-header bg-${section.color} text-white">
                        <h5 class="card-title mb-0">
                            <i class="${section.icon} me-2"></i>${section.title}
                        </h5>
                    </div>
                    <div class="card-body">
                        ${section.fields.map(field => `
                            <div class="mb-3">
                                <label for="${field.id}" class="form-label fw-semibold">${field.label}</label>
                                <select id="${field.id}" class="form-select">
                                    ${field.options.map(option => `
                                        <option value="${option.toLowerCase().replace(/[^a-z0-9]/g, '_')}">${option || 'Select...'}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            additionalInfoContent.appendChild(sectionDiv);
        });
    }

    // Handle Get Report button click
    getReportButton.addEventListener('click', async () => {
        hideError();
        
        // Collect user context from form
        const userContext = {};
        const selects = additionalInfoContent.querySelectorAll('select');
        selects.forEach(select => {
            const key = select.id.replace(/-/g, '_');
            userContext[key] = select.value;
        });

        // Show loading state
        additionalInfoSection.classList.add('d-none');
        loadingSpinnerReport.classList.remove('d-none');
        
        // Scroll to loading section
        loadingSpinnerReport.scrollIntoView({ behavior: 'smooth', block: 'center' });

        try {
            const response = await fetch('/get_diagnosis', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    disease_name: predictedDiseaseName,
                    lang: localStorage.getItem('acd_lang') || 'en',
                    user_context: userContext,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Diagnosis failed.');
            }

            const data = await response.json();
            
            // Convert Markdown to HTML and enhance presentation
            finalReportContent.innerHTML = marked.parse(data.report);
            enhanceReportPresentation(finalReportContent);

            // Show report section
            loadingSpinnerReport.classList.add('d-none');
            reportSectionStandalone.classList.remove('d-none');
            
            // Scroll to report
            reportSectionStandalone.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('Error:', error);
            loadingSpinnerReport.classList.add('d-none');
            additionalInfoSection.classList.remove('d-none');
            showError(`Failed to get report: ${error.message}`);
        }
    });

    // Handle Start Over button click
    startOverButton.addEventListener('click', () => {
        resetForm();
    });

    // Initialize form state
    resetForm();

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.disabled && !this.classList.contains('btn-secondary')) {
                const originalText = this.innerHTML;
                this.style.minWidth = this.offsetWidth + 'px';
                
                setTimeout(() => {
                    if (this.innerHTML === originalText) {
                        this.innerHTML = originalText;
                    }
                }, 3000);
            }
        });
    });
});