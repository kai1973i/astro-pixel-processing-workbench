/**
 * Create GitHub repository using browser session cookies
 * Run this in the browser console after navigating to github.com
 */

async function createGitHubRepo() {
    const repoName = 'astro-pixel-processing-workbench';
    const repoDescription = 'A web-based astrophotography image processing application inspired by Astro Pixel Processor (APP).';
    const privateRepo = false;
    
    try {
        // Get CSRF token from page
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        
        const response = await fetch('https://github.com/api/v3/user/repos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json',
                'X-CSRF-Token': csrfToken || '',
            },
            credentials: 'include',
            body: JSON.stringify({
                name: repoName,
                description: repoDescription,
                private: privateRepo,
                auto_init: false,
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✓ Repository created successfully!');
            console.log('Repository URL: https://github.com/' + data.owner.login + '/' + data.name);
            console.log('Clone URL: ' + data.clone_url);
            return data;
        } else {
            const error = await response.json();
            console.error('✗ Failed to create repository');
            console.error('Status:', response.status);
            console.error('Error:', error.message || JSON.stringify(error));
            return null;
        }
    } catch (error) {
        console.error('✗ Request failed:', error);
        return null;
    }
}

// Execute and show result
createGitHubRepo().then(result => {
    if (result) {
        document.body.innerHTML = `
            <div style="padding: 40px; font-family: system-ui; max-width: 600px; margin: 50px auto; background: #f6f8fa; border-radius: 8px;">
                <h1 style="color: #24292f;">✓ Repository Created</h1>
                <p style="color: #57606a;">Your repository has been created successfully.</p>
                
                <h2 style="color: #24292f; margin-top: 30px;">Repository URL:</h2>
                <p style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d0d7de; word-break: break-all;">
                    <a href="https://github.com/${result.full_name}" style="color: #0969da;">https://github.com/${result.full_name}</a>
                </p>
                
                <h2 style="color: #24292f; margin-top: 20px;">Next Steps:</h2>
                <ol style="color: #57606a; line-height: 1.8;">
                    <li>Add the remote to your local repository:</li>
                    <pre style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d0d7de;">git remote add origin ${result.clone_url}</pre>
                    <li>Push your code:</li>
                    <pre style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d0d7de;">git push -u origin main</pre>
                </ol>
                
                <p style="margin-top: 30px; color: #57606a;">
                    Or use the GitHub CLI:
                </p>
                <pre style="background: #fff; padding: 15px; border-radius: 4px; border: 1px solid #d0d7de;">cd /path/to/project
gh repo set-url origin ${result.clone_url}
git push
                </pre>
            </div>
        `;
    } else {
        document.body.innerHTML = `
            <div style="padding: 40px; font-family: system-ui; max-width: 600px; margin: 50px auto; background: #fff; border-radius: 8px; border: 1px solid #d0d7de;">
                <h1 style="color: #24292f;">Repository Creation Failed</h1>
                <p style="color: #57606a;">Could not create the repository automatically.</p>
                <p style="color: #57606a; margin-top: 20px;">Please create it manually:</p>
                <ol style="color: #57606a; line-height: 1.8;">
                    <li>Go to <a href="https://github.com/new" style="color: #0969da;">github.com/new</a></li>
                    <li>Enter repository name: <strong>astro-pixel-processing-workbench</strong></li>
                    <li>Click "Create repository"</li>
                    <li>Then run: <pre style="background: #f6f8fa; padding: 5px 10px; border-radius: 3px;">git remote add origin https://github.com/YOUR_USERNAME/astro-pixel-processing-workbench.git</pre></li>
                    <li>Push: <pre style="background: #f6f8fa; padding: 5px 10px; border-radius: 3px;">git push -u origin main</pre></li>
                </ol>
            </div>
        `;
    }
});
